import { NextResponse } from 'next/server';
import { IntentSignalRequest, SignalIntentResponse } from '@/lib/types/intents';

const API_URL_BASE = process.env.ZKP2P_API_URL || 'https://api.zkp2p.xyz/v1';
const API_URL = `${API_URL_BASE}/verify/intent`;
const ZKP2P_API_KEY = process.env.ZKP2P_API_KEY;

// checks that the recipient is valid
export async function POST(req: Request) {
    let intent: IntentSignalRequest;
    // parse the mm metadata from the request body
    try {
        intent = await req.json();
    } catch (error) {
        console.error('Error parsing intent request body:', error);
        return NextResponse.json({ error: 'Invalid intent payload' }, { status: 400 });
    }
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ZKP2P_API_KEY!
            },
            body: JSON.stringify(intent)
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error from ZKP2P API:', errorData);
            return NextResponse.json({ error: 'Error getting intent signature from ZKP2p' }, { status: response.status });
        }
        try {
            const intentResponse: SignalIntentResponse = await response.json();
            return NextResponse.json(intentResponse);
        } catch (error) {
            console.error('Error parsing intent signing response from ZKP2P:', error);
            return NextResponse.json({ error: 'Error parsing intent signing response from ZKP2P' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error validating market maker:', error);
        return NextResponse.json({ error: 'Error validating market maker with ZKP2P' }, { status: 500 });
    }    
}
