import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthenticationError, createAuthErrorResponse } from '@/lib/auth-middleware';
import {
  createSambaContract,
  executeContractTransaction,
  waitForTransactionReceipt
} from '@/lib/contract-client';
import {
  getWrapperContractByEmail,
  handleContractError
} from '@/lib/contract-utils';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'samba';
const COLLECTION_NAME = 'intents';

interface CancelIntentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CancelIntentResponse>> {
  try {
    // 1. Authenticate user
    const user = await authenticateRequest(request);
    console.log(`🔐 Authenticated user for cancel intent: ${user.email}`);

    // 2. Connect to MongoDB and look up intent by email
    const client = new MongoClient(MONGODB_URI);
    let intentRecord: any = null;

    try {
      await client.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);

      // Find intent by user email
      intentRecord = await collection.findOne({ email: user.email });

      if (!intentRecord) {
        return NextResponse.json(
          { success: false, error: 'No intent found for user' },
          { status: 404 }
        );
      }

      console.log(`✅ Found intent to cancel: ${intentRecord.intentHash}`);
    } finally {
      await client.close();
    }

    // 3. Get wrapper contract and call cancelIntent
    const wrapperContract = await getWrapperContractByEmail(user.email || '');
    if (!wrapperContract) {
      return NextResponse.json(
        { success: false, error: 'Wrapper contract not found for user' },
        { status: 404 }
      );
    }

    console.log(`🎯 Canceling intent: ${intentRecord.intentHash}`);

    // 4. Execute cancel intent transaction
    const contract = createSambaContract(wrapperContract as `0x${string}`);
    const txHash = await executeContractTransaction(
      contract,
      'cancelIntent',
      [intentRecord.intentHash],
      'cancel intent'
    );

    // 5. Wait for transaction confirmation
    console.log(`⏳ Waiting for cancel transaction confirmation...`);
    const { receipt } = await waitForTransactionReceipt(txHash, "IntentCanceled");

    console.log(`✅ Intent canceled successfully! Hash: ${intentRecord.intentHash}`);
    console.log(`📋 Transaction confirmed in block: ${receipt.blockNumber}`);

    // 6. Delete intent record from database
    const dbClient = new MongoClient(MONGODB_URI);
    try {
      await dbClient.connect();
      const db = dbClient.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);

      const deleteResult = await collection.deleteOne({ email: user.email });

      if (deleteResult.deletedCount > 0) {
        console.log(`🗑️ Intent record deleted for user: ${user.email}`);
      } else {
        console.log(`⚠️ No intent record found to delete for user: ${user.email}`);
      }
    } finally {
      await dbClient.close();
    }

    return NextResponse.json({
      success: true,
      message: 'Intent canceled successfully',
    });

  } catch (error: any) {
    console.error('❌ Cancel intent failed:', error);

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