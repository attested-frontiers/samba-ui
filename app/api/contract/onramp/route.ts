import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthenticationError, createAuthErrorResponse } from '@/lib/auth-middleware';
import { 
  createSambaContract, 
  executeContractTransaction, 
  waitForTransactionReceipt 
} from '@/lib/contract-client';
import {
  prepareFulfillAndOnrampParams,
  handleContractError
} from '@/lib/contract-utils';
import { 
  PaymentPlatforms, 
  ZKP2PCurrencies 
} from '@/lib/types/intents';
import { Proof } from '@/lib/types';

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

    // 2. Parse and validate request body
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

    // 3. Prepare fulfill and onramp parameters
    console.log(`🔧 Preparing fulfill and onramp parameters...`);
    const { amountConverted, encodedProof, offrampIntent } = await prepareFulfillAndOnrampParams(
      amount,
      conversionRate,
      onrampProof,
      currency,
      destinationUsername,
      destinationPlatform
    );

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
    const contract = createSambaContract();
    const txHash = await executeContractTransaction(
      contract,
      'fulfillAndOfframp',
      fulfillAndOfframpArgs,
      'fulfill and offramp'
    );

    // 6. Wait for transaction confirmation
    console.log(`⏳ Waiting for transaction confirmation...`);
    const { receipt } = await waitForTransactionReceipt(txHash);
    
    console.log(`🎉 Fulfill and offramp completed successfully!`);
    console.log(`📋 Transaction confirmed in block: ${receipt.blockNumber}`);

    return NextResponse.json({
      success: true,
      txHash,
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