import { NextRequest, NextResponse } from 'next/server';
import { MarketMakerMetadata, PayeeDetailsResponse, Quote, QuoteRequest } from '@/lib/types/intents';
import { getWrapperContractByEmail } from "@/lib/contract-utils";
import { authenticateRequest, createAuthErrorResponse, AuthenticationError } from "@/lib/auth-middleware";

const API_URL_BASE = process.env.ZKP2P_API_URL || 'https://api.zkp2p.xyz/v1';
const QUOTE_API_URL = `${API_URL_BASE}/quote/exact-fiat?quotesToReturn=5`;
const ZKP2P_API_KEY = process.env.ZKP2P_API_KEY;

export async function POST(req: NextRequest) {
    const user = await authenticateRequest(req);
    console.log(`🔐 Authenticated user: ${user.email}`);

    let quoteRequest: QuoteRequest;
    // parse the quote request
    try {
        quoteRequest = await req.json();
    } catch (error) {
        console.error('Error parsing quote body:', error);
        return NextResponse.json({ error: 'Invalid quote request' }, { status: 400 });
    }

    const wrapperContract = await getWrapperContractByEmail(user.email || '');

    // prepare the actual input for the ZKP2P API
    const payload = {
        paymentPlatforms: [
            quoteRequest.paymentPlatform
        ],
        fiatCurrency: quoteRequest.fiatCurrency,
        user: quoteRequest.user,
        recipient: wrapperContract,
        destinationChainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID!),
        destinationToken: process.env.NEXT_PUBLIC_USDC_CONTRACT,
        exactFiatAmount: quoteRequest.amount
    }
    let quotes: Quote[] = [];
    try {
        const response = await fetch(QUOTE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ZKP2P_API_KEY!
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error from ZKP2P API:', errorData);
            return NextResponse.json({ error: 'Error validating market maker with ZKP2P' }, { status: response.status });
        }
        quotes = await response.json()
            .then(data => data.responseObject.quotes);
    } catch (error) {
        console.error('Error validating market maker:', error);
        return NextResponse.json({ error: 'Error validating market maker with ZKP2P' }, { status: 500 });
    }
    // choose quote with the lowest fee (could be cleaner ik)
    const sortedQuotes = quotes.sort((a, b) => {
        const rateA = BigInt(a.conversionRate);
        const rateB = BigInt(b.conversionRate);

        if (rateA < rateB) return -1;
        if (rateA > rateB) return 1;
        return 0;
    });
    console.log("ZKP2P QUOTES:", sortedQuotes);
    let quote = sortedQuotes[0];

    // default to our quote if one is found
    const defaultPayeeAddress = "0x3729a6a9ceD02C9d0A86ec9834b28825B212aBF3"
    const defaultQuote = quotes.find(q => q.payeeAddress === defaultPayeeAddress);
    quote = defaultQuote || quote;

    // todo: more complex, just choose only returned one
    // retrieve the payment details for the recipient
    const detailsRoute = `${API_URL_BASE}/makers/${quoteRequest.paymentPlatform}/${quote.intent.payeeDetails}`;
    console.log("ZKP2P DETAILS ROUTE:", detailsRoute);
    let payeeDetails: PayeeDetailsResponse;
    try {
        const detailsResponse = await fetch(detailsRoute, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ZKP2P_API_KEY!
            }
        });
        if (!detailsResponse.ok) {
            const errorData = await detailsResponse.json();
            console.error('Error from ZKP2P API:', errorData);
            return NextResponse.json({ error: 'Error fetching payment details from ZKP2P' }, { status: detailsResponse.status });
        }
        payeeDetails = await detailsResponse.json().then(data => data.responseObject);
    } catch (error) {

        // Handle authentication errors specifically
        if (error instanceof AuthenticationError) {
            const authError = createAuthErrorResponse(error);
            return NextResponse.json(authError, { status: authError.statusCode });
        }


        console.error('Error fetching payment details:', error);
        return NextResponse.json({ error: 'Error fetching payment details from ZKP2P' }, { status: 500 });
    }

    // return important info
    return NextResponse.json({
        intent: quote,
        details: payeeDetails,
    }, { status: 200 });
}
