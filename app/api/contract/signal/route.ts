import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthenticationError, createAuthErrorResponse } from '@/lib/auth-middleware';
import {
  createSambaContract,
  executeContractTransaction,
  waitForTransactionReceipt
} from '@/lib/contract-client';
import {
  prepareSignalIntentPayload,
  calculateConvertedAmount,
  handleContractError,
  getWrapperContractByEmail
} from '@/lib/contract-utils';
import { currencyKeccak256 } from '@/lib/chain';
import { platformToVerifier } from '@/lib/utils';
import { parseUnits } from 'viem';
import {
  QuoteResponse,
  PaymentPlatforms,
  ZKP2PCurrencies
} from '@/lib/types/intents';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'samba';
const COLLECTION_NAME = 'intents';

interface IntentMetadata {
  recipient: string;
  amount: string;
  platform: PaymentPlatforms;
}

interface SignalIntentRequest {
  quote: QuoteResponse;
  amount: string;
  verifier: `0x${string}`;
  currency: ZKP2PCurrencies;
  metadata: IntentMetadata;
}

interface SignalIntentResponse {
  success: boolean;
  intentHash?: string;
  txHash?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SignalIntentResponse>> {
  try {
    // 1. Authenticate user
    const user = await authenticateRequest(request);
    console.log(`🔐 Authenticated user: ${user.email}`);
    let wrapperContract: `0x${string}` | null = null;
    try {
       wrapperContract = await getWrapperContractByEmail(user.email || '');
    } catch (error) {
      console.error('Error retrieving wrapper contract:', error);
      return NextResponse.json(
        { success: false, error: 'Error retrieving wrapper contract' },
        { status: 404 }
      );
    };
    
    // 2. Parse and validate request body
    const body: SignalIntentRequest = await request.json();
    const { quote, amount, verifier, currency, metadata } = body;

    if (!quote || !amount || !verifier || !currency || !metadata) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: quote, amount, verifier, currency, metadata' },
        { status: 400 }
      );
    }

    if (!metadata.recipient || !metadata.amount || !metadata.platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required metadata fields: recipient, amount, platform' },
        { status: 400 }
      );
    }

    console.log(`📋 Signal Intent Request:`, {
      amount,
      currency,
      verifier,
      depositId: quote.intent.intent.depositId,
      paymentMethod: quote.intent.paymentMethod,
    });

    // 3. Prepare signal intent payload
    const payload = prepareSignalIntentPayload(quote, amount, currency, wrapperContract!);
    console.log(`📦 Signal Intent Payload:`, payload);

    // 4. Get gating service signature from ZKP2P API
    console.log(`🔑 Getting gating service signature...`);

    const API_URL_BASE = process.env.ZKP2P_API_URL || 'https://api.zkp2p.xyz/v1';
    const API_URL = `${API_URL_BASE}/verify/intent`;
    const ZKP2P_API_KEY = process.env.ZKP2P_API_KEY;

    if (!ZKP2P_API_KEY) {
      throw new Error('ZKP2P_API_KEY not configured');
    }

    const gatingResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ZKP2P_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!gatingResponse.ok) {
      const errorData = await gatingResponse.json();
      console.error('Error from ZKP2P Gating API:', errorData);
      throw new Error('Error getting intent signature from ZKP2P');
    }

    const gatingData = await gatingResponse.json();
    const gatingServiceSignature = gatingData.responseObject.intentData.gatingServiceSignature;
    console.log(`✅ Got gating service signature`);

    // 5. Prepare contract parameters
    const amountFormatted = parseUnits(amount, 6);
    const amountConverted = calculateConvertedAmount(
      amountFormatted.toString(),
      quote.intent.conversionRate
    );
    const currencyHash = currencyKeccak256(currency);
    const depositId = quote.intent.intent.depositId.toString();

    const signalIntentArgs = [
      depositId,
      amountConverted,
      verifier,
      currencyHash,
      gatingServiceSignature,
    ] as const;

    console.log(`🔧 Contract parameters:`, {
      depositId,
      amountConverted,
      verifier,
      currencyHash,
      gatingServiceSignature: `${gatingServiceSignature.slice(0, 10)}...`,
    });

    // 6. Execute signal intent transaction
    const contract = createSambaContract(wrapperContract!);
    const txHash = await executeContractTransaction(
      contract,
      'signalIntent',
      signalIntentArgs,
      'signal intent'
    );

    // 7. Wait for transaction confirmation and get intent hash
    const { receipt, eventLogs } = await waitForTransactionReceipt(txHash, 'IntentSignaled');

    if (!eventLogs || eventLogs.length === 0) {
      throw new Error('IntentSignaled event not found in transaction receipt');
    }

    const intentHash = eventLogs[0].topics[3] as string;
    console.log(`🎯 Intent signaled successfully! Intent hash: ${intentHash}`);

    // 8. Save intent metadata to MongoDB after successful contract call
    const client = new MongoClient(MONGODB_URI);
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);

      const intentRecord = {
        email: user.email,
        intentHash,
        txHash,
        recipient: metadata.recipient,
        amount: metadata.amount,
        platform: metadata.platform,
        currency,
        createdAt: new Date(),
      };

      await collection.insertOne(intentRecord);
      console.log(`💾 Intent saved to database for user: ${user.email}, hash: ${intentHash}`);
    } catch (dbError) {
      console.error('❌ Failed to save intent to database:', dbError);
      // Don't fail the entire request if database save fails
    } finally {
      await client.close();
    }

    return NextResponse.json({
      success: true,
      intentHash,
      txHash,
    });

  } catch (error: any) {
    console.error('❌ Signal intent failed:', error);

    // Handle authentication errors specifically
    if (error instanceof AuthenticationError) {
      const authError = createAuthErrorResponse(error);
      return NextResponse.json(authError, { status: authError.statusCode });
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

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    console.log(`🔐 Authenticated user looking up intent: ${user.email}`);

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    try {
      await client.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);

      // Find intent by user email
      const intentRecord = await collection.findOne({ email: user.email });

      if (!intentRecord) {
        return NextResponse.json(
          { message: 'No intent found for user' },
          { status: 404 }
        );
      }

      console.log(`✅ Found existing intent for user: ${user.email}, hash: ${intentRecord.intentHash}`);

      return NextResponse.json({
        success: true,
        intent: {
          intentHash: intentRecord.intentHash,
          txHash: intentRecord.txHash,
          recipient: intentRecord.recipient,
          amount: intentRecord.amount,
          platform: intentRecord.platform,
          currency: intentRecord.currency,
          createdAt: intentRecord.createdAt,
        },
      });

    } finally {
      await client.close();
    }

  } catch (error: any) {
    console.error('❌ Get intent failed:', error);

    // Handle authentication errors specifically
    if (error instanceof AuthenticationError) {
      const authError = createAuthErrorResponse(error);
      return NextResponse.json(authError, { status: authError.statusCode });
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}