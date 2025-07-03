import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthenticationError, createAuthErrorResponse } from '@/lib/auth-middleware';
import WrapperArtifact from '@/lib/artifacts/Wrapper.json';
import { MongoClient } from 'mongodb';
import { createBackendClients } from '@/lib/contract-client';
import { getWrapperContractByEmail } from "@/lib/contract-utils";
import { createTGNotificationRequest } from '@/lib/notification';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'samba';
const COLLECTION_NAME = 'user';

const { NEXT_PUBLIC_ZKP2P_CONTRACT, NEXT_PUBLIC_USDC_CONTRACT, NEXT_PUBLIC_ADMIN_PUBKEY } = process.env;


export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        console.log(`🔐 Authenticated user: ${user.email}`);

        // Step 1: Check if a contract exists for the user
        const existingWrapperContract = await getWrapperContractByEmail(user.email || '');

        if (existingWrapperContract) {
            console.log(`✅ Existing wrapper contract found: ${existingWrapperContract}`);
            return NextResponse.json({
                wrapperContract: existingWrapperContract
            });
        }

        // Step 2: Deploy contract if it doesn't exist
        console.log(`🚀 No existing contract found. Deploying new wrapper contract for user: ${user.email}`);

        // Connect to MongoDB
        const client = new MongoClient(MONGODB_URI);

        try {
            await client.connect();
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);

            // Create contract factory
            const { publicClient, walletClient } = createBackendClients();

            // Deploy the contract using viem
            const hash = await walletClient.deployContract({
                abi: WrapperArtifact.abi,
                bytecode: `${WrapperArtifact.bytecode}` as `0x${string}`,
                args: [NEXT_PUBLIC_ZKP2P_CONTRACT, NEXT_PUBLIC_USDC_CONTRACT, NEXT_PUBLIC_ADMIN_PUBKEY],
            });

            // Wait for deployment
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            const wrapperContract = receipt.contractAddress;

            console.log(`✅ Wrapper contract deployed at: ${wrapperContract}`);

            // Step 3: Save to database
            await collection.updateOne(
                { email: user.email },
                {
                    $set: {
                        email: user.email,
                        wrapperContract,
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            );

            console.log(`💾 Wrapper contract saved to database for user: ${user.email}`);

            // Step 5: Send notification to Telegram bot
            await createTGNotificationRequest(
                wrapperContract as `0x${string}`,
                user.email as string
            );

            // Step 5: Return the contract address
            return NextResponse.json({
                wrapperContract
            }, { status: 201 });

        } finally {
            await client.close();
        }

    } catch (error) {
        console.error('Error with contract deployment:', error);

        if (error instanceof AuthenticationError) {
            const authError = createAuthErrorResponse(error);
            return NextResponse.json(authError, { status: authError.statusCode });
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 