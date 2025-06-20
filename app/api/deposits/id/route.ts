import { NextResponse } from 'next/server';
import { DepositResponse } from '@/lib/types/intents';

const API_URL_BASE = process.env.ZKP2P_API_URL || 'https://api.zkp2p.xyz/v1';
const API_URL = `${API_URL_BASE}/makers/create`;
const ZKP2P_API_KEY = process.env.ZKP2P_API_KEY;

// checks that the recipient is valid
export async function POST(req: Request) {
    // get the id and platform from the query parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const platform = url.searchParams.get('platform');
    if (!id || !platform) {
        return NextResponse.json(
            { error: 'Missing id or platform query parameters' },
            { status: 400 }
        );
    }
    // request deposits from the ZKP2P API
    let deposits: DepositResponse[] = [];
    try {
        const response = await fetch(`${API_URL}/${id}/deposits?platform=${platform}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": ZKP2P_API_KEY!
                }
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error from ZKP2P API:', errorData);
            return NextResponse.json(
                { error: 'Error fetching hashed onchain ID from ZKP2P' },
                { status: response.status }
            );
        }
        deposits = await response.json();
    } catch (error) {
        console.error('Error fetching deposits:', error);
        return NextResponse.json(
            { error: 'Error fetching deposits from ZKP2P' },
            { status: 500 }
        );
    }
    // parse the deposits response for the hashed onchain ID
    const idNum = parseInt(id);
    const filteredDeposits = deposits.find((deposit) => deposit.id === idNum);
    if (!filteredDeposits) {
        return NextResponse.json(
            { error: 'No deposits found for the given ID' },
            { status: 404 }
        );
    }
    return NextResponse.json(
        { hashedOnchainId: filteredDeposits.hashedOnchainId },
        { status: 200 }
    )
}
