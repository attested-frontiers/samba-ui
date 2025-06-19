import { NextResponse } from 'next/server';
import { MarketMakerMetadata } from '@/lib/types/intents';

const API_URL_BASE = process.env.ZKP2P_API_URL || 'https://api.zkp2p.xyz/v1';
const API_URL = `${API_URL_BASE}/makers/create`;
const ZKP2P_API_KEY = process.env.ZKP2P_API_KEY;

export async function POST(req: Request) {
    let metadata: MarketMakerMetadata;
    // parse the mm metadata from the request body
    try {
        metadata = await req.json();
    } catch (error) {
        console.error('Error parsing request body:', error);
        return NextResponse.json({ error: 'Invalid market maker metadata' }, { status: 400 });
    }
    try {
        let response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ZKP2P_API_KEY!
            },
            body: JSON.stringify(metadata)
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error from ZKP2P API:', errorData);
            return NextResponse.json({ error: 'Error validating market maker with ZKP2P' }, { status: response.status });
        }
        const hashedOnchainId: string = await response.json()
            .then(data => data.responseObject.hashedOnchainId);
        return NextResponse.json({ hashedOnchainId });
    } catch (error) {
        console.error('Error validating market maker:', error);
        return NextResponse.json({ error: 'Error validating market maker with ZKP2P' }, { status: 500 });
    }    
}
