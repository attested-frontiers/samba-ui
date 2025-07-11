import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthenticationError, createAuthErrorResponse } from '@/lib/auth-middleware';
import {
  createSambaContract,
  executeContractTransaction,
  waitForTransactionReceipt
} from '@/lib/contract-client';
import {
  calculateConvertedAmount,
  getWrapperContractByEmail,
  handleContractError
} from '@/lib/contract-utils';
import { currencyKeccak256 } from '@/lib/chain';
import { getMarketMakerMetadataPayload, platformToVerifier } from '@/lib/utils';
import { parseExtensionProof, encodeProofAsBytes } from '@/lib/types';
import { parseUnits } from 'viem';
import { ethers } from 'ethers';
import {
  PaymentPlatforms,
  ZKP2PCurrencies
} from '@/lib/types/intents';
import { Proof } from '@/lib/types';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'samba';
const COLLECTION_NAME = 'intents';

interface FulfillAndOnrampRequest {
  amount: string;
  conversionRate: string;
  intentHash: `0x${string}`;
  onrampProof: Proof;
  currency: ZKP2PCurrencies;
  destinationUsername: string;
  destinationPlatform: PaymentPlatforms;
}

interface FulfillAndOnrampResponse {
  success: boolean;
  txHash?: string;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<FulfillAndOnrampResponse>> {
  try {
    // 1. Authenticate user
    const user = await authenticateRequest(request);
    console.log(`🔐 Authenticated user: ${user.email}`);

    // 2. Get the contract address
    const wrapperContract = await getWrapperContractByEmail(user.email || '');

    // 3. Parse and validate request body
    const body: FulfillAndOnrampRequest = await request.json();
    const {
      amount,
      conversionRate,
      intentHash,
      onrampProof,
      currency,
      destinationUsername,
      destinationPlatform
    } = body;

    if (!amount || !conversionRate || !intentHash || !onrampProof || !currency || !destinationUsername || !destinationPlatform) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`📋 Fulfill and Onramp Request:`, {
      amount,
      conversionRate,
      intentHash,
      currency,
      destinationUsername,
      destinationPlatform,
      proofStatus: onrampProof ? 'provided' : 'missing',
    });

    // 4. Prepare fulfill and onramp parameters
    console.log(`🔧 Preparing fulfill and onramp parameters...`);

    // Get the payee details hash from ZKP2P API
    const marketMakerMetadataPayload = getMarketMakerMetadataPayload(
      destinationUsername,
      destinationPlatform
    );

    console.log("Validating market maker with ZKP2P:", marketMakerMetadataPayload);

    const API_URL_BASE = process.env.ZKP2P_API_URL || 'https://api.zkp2p.xyz/v1';
    const API_URL = `${API_URL_BASE}/makers/create`;
    const ZKP2P_API_KEY = process.env.ZKP2P_API_KEY;

    if (!ZKP2P_API_KEY) {
      throw new Error('ZKP2P_API_KEY not configured');
    }

    const validationResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ZKP2P_API_KEY
      },
      body: JSON.stringify(marketMakerMetadataPayload)
    });

    if (!validationResponse.ok) {
      const errorData = await validationResponse.json();
      console.error('Error from ZKP2P API:', errorData);
      throw new Error('Error validating market maker with ZKP2P');
    }

    const validationData = await validationResponse.json();
    const payeeDetailsHash = validationData.responseObject.hashedOnchainId;

    // Generate the currency hash and rate
    const currencyWithRate = [
      [
        {
          code: currencyKeccak256(currency),
          conversionRate: ethers.utils.parseUnits('1'),
        },
      ],
    ];

    // Format and convert the amount
    const amountFormatted = parseUnits(amount, 6);
    const amountConverted = calculateConvertedAmount(
      amountFormatted.toString(),
      conversionRate
    );

    // Prepare the proof
    const parsedProof = parseExtensionProof(onrampProof);
    const encodedProof = encodeProofAsBytes(parsedProof);

    // Prepare verifier data
    const intentsGating = process.env.NEXT_PUBLIC_INTENTS_GATING_ADDRESS as `0x${string}`;
    const verifierData = [
      {
        intentGatingService: intentsGating,
        payeeDetails: payeeDetailsHash,
        data: ethers.utils.defaultAbiCoder.encode(
          ['address[]'],
          [['0x0636c417755E3ae25C6c166D181c0607F4C572A3']]
        ),
      },
    ];

    // Get verifier address
    const verifier = platformToVerifier(destinationPlatform);
    const offrampIntent = {
      verifiers: [verifier],
      data: verifierData,
      currencies: currencyWithRate,
    };

    console.log(`✅ Parameters prepared:`, {
      amountConverted,
      encodedProofLength: encodedProof.length,
      offrampIntentVerifiers: offrampIntent.verifiers.length,
      offrampIntentData: offrampIntent.data.length,
      offrampIntentCurrencies: offrampIntent.currencies.length,
    });

    // 4. Prepare contract parameters
    const fulfillAndOfframpArgs = [
      amountConverted,
      intentHash,
      encodedProof,
      offrampIntent,
    ] as const;

    console.log(`🎯 Executing fulfill and offramp for intent: ${intentHash}`);

    // 5. Execute fulfill and offramp transaction
    const wrapperContractAddress = await getWrapperContractByEmail(user.email || '');
    const contract = createSambaContract(wrapperContractAddress as `0x${string}` || '0x');
    const txHash = await executeContractTransaction(
      contract,
      'fulfillAndOfframp',
      fulfillAndOfframpArgs,
      'fulfill and offramp'
    );

    // 6. Wait for transaction confirmation
    console.log(`⏳ Waiting for transaction confirmation...`);
    const { receipt, eventLogs } = await waitForTransactionReceipt(txHash, "DepositReceived");
    let depositId = "0";
    try {
      const depositReceivedTopic = "0x68a835da25522a6767ad280764ce2daed02507359a889e4a18219458d2f356b4";
      let log = receipt.logs.filter((log: any) => log.topics[0] === depositReceivedTopic);
      if (!log) {
        throw new Error('DepositReceived event not found in transaction receipt');
      }
      depositId = parseInt(log[0].topics[1], 16).toString();
    } catch (error) {
      console.error("❌ Error processing event logs:", error);
    }
    
    console.log(`🎯 Intent signaled successfully! Intent hash: ${intentHash}`);
    console.log(`💰 Deposit ID: ${depositId}`);
    console.log(`🎉 Fulfill and offramp completed successfully!`);
    console.log(`📋 Transaction confirmed in block: ${receipt.blockNumber}`);

    // 7. Delete intent record from database after successful completion
    const client = new MongoClient(MONGODB_URI);
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);

      const deleteResult = await collection.deleteOne({ email: user.email });
      
      if (deleteResult.deletedCount > 0) {
        console.log(`🗑️ Intent record deleted for user: ${user.email}`);
      } else {
        console.log(`ℹ️ No intent record found to delete for user: ${user.email} (this is fine)`);
      }
    } catch (dbError) {
      console.error('❌ Failed to delete intent from database:', dbError);
      // Don't fail the entire request if database deletion fails
    } finally {
      await client.close();
    }

    return NextResponse.json({
      success: true,
      txHash,
      depositId,
      message: 'Onramp confirmed, offramp queued',
    });

  } catch (error: any) {
    console.error('❌ Fulfill and onramp failed:', error);

    // Handle authentication errors specifically
    if (error instanceof AuthenticationError) {
      const authError = createAuthErrorResponse(error);
      return NextResponse.json(authError, { status: authError.statusCode });
    }

    // Special handling for detailed contract errors
    if (error.name === 'ContractFunctionRevertedError') {
      console.error('🚨 Contract reverted details:');
      console.error('Revert reason:', error.data?.errorName || 'Unknown');
      console.error('Short message:', error.shortMessage);
      console.error('Error data:', error.data);
    }

    if (error.details) {
      console.error('Error details:', error.details);
    }

    if (error.cause) {
      console.error('Error cause:', error.cause);
    }

    // Log full error for debugging
    try {
      console.error('Full error object:', JSON.stringify(error, (key, value) => {
        if (typeof value === 'function') return '[Function]';
        if (typeof value === 'object' && value !== null) {
          if (value.constructor && value.constructor.name !== 'Object') {
            return `[${value.constructor.name}]`;
          }
        }
        return value;
      }, 2));
    } catch (e) {
      console.error('Could not stringify error object');
    }

    const errorMessage = handleContractError(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// Also support GET for testing (remove in production)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Fulfill and Onramp API endpoint',
    description: 'POST to fulfill an intent and execute onramp on the Samba contract',
    requiredFields: [
      'amount',
      'conversionRate',
      'intentHash',
      'onrampProof',
      'currency',
      'destinationUsername',
      'destinationPlatform'
    ],
    authentication: 'Bearer token required',
  });
}