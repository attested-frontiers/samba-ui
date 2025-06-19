import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { Intent } from '@/lib/types/intents';
import { generateGatingServiceSignature } from '@/lib/chain';

// todo: just import pubkey instead of loading privkey
const intentsGate = new ethers.Wallet(process.env.INTENTS_GATING_PRIV!);

// Gets the signing pubkey
export async function GET() {
  return NextResponse.json({ intentsGatingPubkey: intentsGate.publicKey });
}

// Sign an intent
export async function POST(req: Request) {
    let intent: Intent;
    // parse the intent from the request body
    try {
        intent = await req.json();
    } catch (error) {
        console.error('Error parsing request body:', error);
        return NextResponse.json({ error: 'Invalid intent to sign' }, { status: 400 });
    }
    // sign the intent
    console.log("Signing intent:", intent);
    try {
        const signature = await generateGatingServiceSignature(intentsGate, intent);
        return NextResponse.json({ signature });
    } catch (error) {
        console.error('Error signing intent:', error);
        return NextResponse.json({ error: 'Error signing intent' }, { status: 500 });
    }
}
