import { parseUnits } from 'viem';
import {
  ZKP2PCurrencies,
  QuoteResponse,
  IntentSignalRequest
} from './types/intents';
import { currencyKeccak256 } from './chain';
import { MongoClient } from 'mongodb';

// Contract addresses from environment
export const getContractAddresses = () => ({
  samba: process.env.NEXT_PUBLIC_SAMBA_CONTRACT as `0x${string}`,
  intentsGating: process.env.NEXT_PUBLIC_INTENTS_GATING_ADDRESS as `0x${string}`,
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || '31337',
});

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'samba';
const COLLECTION_NAME = 'user';

/**
 * Helper function to get wrapper contract address from MongoDB by email
 */
export async function getWrapperContractByEmail(email: string): Promise<string | null> {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const userContract = await collection.findOne({ email });

    return userContract?.wrapperContract || null;
  } catch (error) {
    console.error('Error retrieving wrapper contract:', error);
    return null;
  } finally {
    await client.close();
  }
}
/**
 * Calculate converted amount based on conversion rate
 */
export function calculateConvertedAmount(
  intentAmount: string,
  conversionRate: string
): string {
  const paymentAmountBN = BigInt(intentAmount);
  const feeRateBN = BigInt(conversionRate);
  const RATE_DECIMALS = BigInt(10 ** 18);

  // Calculate: paymentAmount * 10^18 / feeRate
  const result = (paymentAmountBN * RATE_DECIMALS) / feeRateBN;

  return result.toString();
}

/**
 * Prepare signal intent payload for gating service
 */
export function prepareSignalIntentPayload(
  quote: QuoteResponse,
  amount: string,
  currency: ZKP2PCurrencies
): IntentSignalRequest {
  const { chainId, samba: sambaContractAddress } = getContractAddresses();

  // Calculate amount after conversion rate
  const amountFormatted = parseUnits(amount, 6);
  const amountConverted = calculateConvertedAmount(
    amountFormatted.toString(),
    quote.intent.conversionRate
  );

  // Generate the currency hash
  const currencyHash = currencyKeccak256(currency);
  const depositId = quote.intent.intent.depositId.toString();

  return {
    processorName: quote.intent.paymentMethod,
    depositId: depositId,
    tokenAmount: amountConverted,
    payeeDetails: quote.details.hashedOnchainId,
    toAddress: sambaContractAddress,
    fiatCurrencyCode: currencyHash,
    chainId: chainId,
  };
}



/**
 * Parse transaction receipt for event logs
 */
export function parseIntentSignaledEvent(receipt: any, abi: any): string {
  // This will be implemented with viem's parseEventLogs
  // For now, returning a placeholder
  return receipt.logs?.[0]?.topics?.[3] || '0x0';
}

/**
 * Error handling utilities
 */
export function handleContractError(error: any): string {
  console.error('=== CONTRACT ERROR DETAILS ===');
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);

  // Check for specific error types
  if (error.name === 'ContractFunctionRevertedError') {
    console.error('Contract reverted!');
    console.error('Revert reason:', error.data?.errorName || 'Unknown');
    console.error('Short message:', error.shortMessage);
    return `Contract error: ${error.shortMessage || error.message}`;
  }

  // Handle other common errors
  if (error.message?.includes('insufficient funds')) {
    return 'Insufficient funds for transaction';
  }

  if (error.message?.includes('user rejected')) {
    return 'Transaction was rejected';
  }

  if (error.message?.includes('network')) {
    return 'Network error occurred';
  }

  return error.message || 'Unknown contract error';
}