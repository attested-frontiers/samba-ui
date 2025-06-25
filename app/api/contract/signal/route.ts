import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthenticationError, createAuthErrorResponse } from '@/lib/auth-middleware';
import { 
  createSambaContract, 
  executeContractTransaction, 
  waitForTransactionReceipt 
} from '@/lib/contract-client';
import {
  prepareSignalIntentPayload,
  getGatingServiceSignature,
  calculateConvertedAmount,
  handleContractError
} from '@/lib/contract-utils';
import { currencyKeccak256 } from '@/lib/chain';
import { platformToVerifier } from '@/lib/utils';
import { parseUnits } from 'viem';
import { 
  QuoteResponse, 
  PaymentPlatforms, 
  ZKP2PCurrencies 
} from '@/lib/types/intents';

interface SignalIntentRequest {
  quote: QuoteResponse;
  amount: string;
  verifier: `0x${string}`;
  currency: ZKP2PCurrencies;
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

    // 2. Parse and validate request body
    const body: SignalIntentRequest = await request.json();
    const { quote, amount, verifier, currency } = body;

    if (!quote || !amount || !verifier || !currency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: quote, amount, verifier, currency' },
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
    const payload = prepareSignalIntentPayload(quote, amount, currency);
    console.log(`📦 Signal Intent Payload:`, payload);

    // 4. Get gating service signature
    console.log(`🔑 Getting gating service signature...`);
    const gatingServiceSignature = await getGatingServiceSignature(payload);
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
    const contract = createSambaContract();
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

// Also support GET for testing (remove in production)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Signal Intent API endpoint',
    description: 'POST to signal an intent on the Samba contract',
    requiredFields: ['quote', 'amount', 'verifier', 'currency'],
    authentication: 'Bearer token required',
  });
}