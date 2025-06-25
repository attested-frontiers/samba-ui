import { parseUnits } from 'viem';
import { ethers } from 'ethers';
import { 
  PaymentPlatforms, 
  ZKP2PCurrencies, 
  QuoteResponse,
  IntentSignalRequest 
} from './types/intents';
import { currencyKeccak256 } from './chain';
import { platformToVerifier, getMarketMakerMetadataPayload } from './utils';
import { parseExtensionProof, encodeProofAsBytes, Proof } from './types';

// Contract addresses from environment
export const getContractAddresses = () => ({
  samba: process.env.NEXT_PUBLIC_SAMBA_CONTRACT as `0x${string}`,
  intentsGating: process.env.NEXT_PUBLIC_INTENTS_GATING_ADDRESS as `0x${string}`,
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || '31337',
});

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
 * Get gating service signature from API
 */
export async function getGatingServiceSignature(payload: IntentSignalRequest): Promise<string> {
  const response = await fetch('/api/intents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error from Gating Service API:', errorData);
    throw new Error('Error getting gating service signature');
  }
  
  const data = await response.json();
  return data.responseObject.intentData.gatingServiceSignature;
}

/**
 * Prepare fulfill and onramp parameters
 */
export async function prepareFulfillAndOnrampParams(
  amount: string,
  conversionRate: string,
  onrampProof: Proof,
  currency: ZKP2PCurrencies,
  destinationUsername: string,
  destinationPlatform: PaymentPlatforms
) {
  const { intentsGating } = getContractAddresses();
  
  // Get the payee details hash
  const marketMakerMetadataPayload = getMarketMakerMetadataPayload(
    destinationUsername,
    destinationPlatform
  );
  
  // Validate market maker with ZKP2P API
  const response = await fetch('/api/deposits/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(marketMakerMetadataPayload),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error from ZKP2P API:', errorData);
    throw new Error('Error validating market maker with ZKP2P');
  }
  
  const validationData = await response.json();
  const payeeDetailsHash = validationData.hashedOnchainId;
  
  // Generate the currency hash and rate
  const currencyWithRate = [
    [
      {
        code: currencyKeccak256(currency),
        conversionRate: ethers.utils.parseUnits('1'),
      },
    ],
  ];
  
  // Format and convert the amount
  const amountFormatted = parseUnits(amount, 6);
  const amountConverted = calculateConvertedAmount(
    amountFormatted.toString(),
    conversionRate
  );
  
  // Prepare the proof
  const parsedProof = parseExtensionProof(onrampProof);
  const encodedProof = encodeProofAsBytes(parsedProof);
  
  // Prepare verifier data
  const verifierData = [
    {
      intentGatingService: intentsGating,
      payeeDetails: payeeDetailsHash,
      data: ethers.utils.defaultAbiCoder.encode(
        ['address[]'],
        [['0x0636c417755E3ae25C6c166D181c0607F4C572A3']]
      ),
    },
  ];
  
  // Get verifier address
  const verifier = platformToVerifier(destinationPlatform);
  const offrampIntent = {
    verifiers: [verifier],
    data: verifierData,
    currencies: currencyWithRate,
  };
  
  return {
    amountConverted,
    encodedProof,
    offrampIntent,
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