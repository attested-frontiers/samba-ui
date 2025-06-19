// import { NextResponse } from 'next/server';
// import { ethers } from 'ethers';
// import { Intent } from '@/lib/types/intents';
// import { generateGatingServiceSignature } from '@/lib/chain';

// const intentsGate = new ethers.Wallet(process.env.INTENTS_GATING_PRIV!);

// // https://api.zkp2p.xyz/v1/makers/create
// // Gets the signing pubkey
// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const recipient = searchParams.get('recipient');

//   console.log('Recipient:', recipient);

//   return NextResponse.json({ intentsGatingPubkey: intentsGate.publicKey, recipient });
// }

// // // Sign an intent
// // export async function POST(req: Request) {
// //     let intent: Intent;
// //     // parse the intent from the request body
// //     try {
// //         intent = await req.json();
// //     } catch (error) {
// //         console.error('Error parsing request body:', error);
// //         return NextResponse.json({ error: 'Invalid intent to sign' }, { status: 400 });
// //     }
// //     // sign the intent
// //     try {
// //         const signature = await generateGatingServiceSignature(intentsGate, intent);
// //         return NextResponse.json({ signature });
// //     } catch (error) {
// //         console.error('Error signing intent:', error);
// //         return NextResponse.json({ error: 'Error signing intent' }, { status: 500 });
// //     }
// // }

// // const getPayeeDetailsHash = async (receiveTo: string): Promise<string> => {
// //   const API_KEY = "zkp2p6xKYfbIdv9vmDtT3yqJkJMWyv7QF7dAi8APwxb6Z2pbfZVrJTV3CbwedWKu6Ryn3g38RluroNeT55LqRbj7Fr3O3UKtGGm4F0ioGrIvcHih59o2mNJ1lxtZOP4O";
// //   const API_URL = "";

// //   const payload = {
// //     depositData: {
// //       venmoUsername: receiveTo,
// //       telegramUsername: ""
// //     },
// //     processorName: "venmo"
// //   };

// //   const response = await fetch(API_URL, {
// //     method: "POST",
// //     headers: {
// //       "Content-Type": "application/json",
// //       "x-api-key": API_KEY
// //     },
// //     body: JSON.stringify(payload)
// //   });

// //   if (!response.ok) {
// //     throw new Error(`HTTP error! status: ${response.status}`);
// //   }

// //   const data = await response.json();
// //   console.log("Payee details response:", data.responseObject.hashedOnchainId);
// //   return data.responseObject.hashedOnchainId as string;
// // }