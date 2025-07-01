import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthenticationError, createAuthErrorResponse } from '@/lib/auth-middleware';
import WrapperArtifact from '@/lib/artifacts/Wrapper.json';
import { MongoClient } from 'mongodb';
import { createBackendClients } from '@/lib/contract-client';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'samba';
const COLLECTION_NAME = 'user';

const { NEXT_PUBLIC_ZKP2P_CONTRACT, NEXT_PUBLIC_USDC_CONTRACT, NEXT_PUBLIC_ADMIN_PUBKEY } = process.env;

export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        console.log(`🔐 Authenticated user: ${user.email}`);

        // Connect to MongoDB
        const client = new MongoClient(MONGODB_URI);

        try {
            await client.connect();
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);

            // Find user by email
            const userContract = await collection.findOne({ email: user.email });

            if (userContract && userContract.wrapperContract) {
                return NextResponse.json({
                    wrapperContract: userContract.wrapperContract
                });
            } else {
                return NextResponse.json({
                    message: 'No contract found'
                });
            }

        } finally {
            await client.close();
        }

    } catch (error) {
        console.error('Error checking contract address:', error);

        // Handle authentication errors specifically
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

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        console.log(`🔐 Authenticated user: ${user.email}`);

        // Connect to MongoDB
        const client = new MongoClient(MONGODB_URI);

        try {
            await client.connect();
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);

            // Deploy new wrapper contract instance
            console.log(`🚀 Deploying new wrapper contract for user: ${user.email}`);

            // Create contract factory
            const { publicClient, walletClient } = createBackendClients();

            console.log('Next Public ZKP2P Contract', NEXT_PUBLIC_ZKP2P_CONTRACT);
            console.log('Next Public USDC Contract', NEXT_PUBLIC_USDC_CONTRACT);
            console.log('Next Public Admin Pubkey', NEXT_PUBLIC_ADMIN_PUBKEY);

            // Deploy the contract using viem
            const hash = await walletClient.deployContract({
                abi: WrapperArtifact.abi,
                bytecode: `0x${WrapperArtifact.bytecode}`,
                args: [NEXT_PUBLIC_ZKP2P_CONTRACT, NEXT_PUBLIC_USDC_CONTRACT, NEXT_PUBLIC_ADMIN_PUBKEY],
            });

            // Wait for deployment
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            const wrapperContract = receipt.contractAddress;

            console.log(`✅ Wrapper contract deployed at: ${wrapperContract}`);

            // Save to database
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

            console.log(`💾 Wrapper contract saved to database for user: ${user.email} `);

            return NextResponse.json({
                message: 'Wrapper contract deployed and saved successfully',
                wrapperContract: wrapperContract.address
            });

        } finally {
            await client.close();
        }

    } catch (error) {
        console.error('Error saving contract address:', error);

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