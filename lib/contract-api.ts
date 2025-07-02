import { makeAuthenticatedRequest } from './firebase';
import { 
  QuoteResponse, 
  PaymentPlatforms, 
  ZKP2PCurrencies 
} from './types/intents';
import { Proof } from './types';

/**
 * Frontend API client for contract operations
 * These functions replace the SambaContext functions
 */

interface IntentMetadata {
  recipient: string;
  amount: string;
  platform: PaymentPlatforms;
}

interface SignalIntentRequest {
  quote: QuoteResponse;
  amount: string;
  verifier: `0x${string}`;
  currency: ZKP2PCurrencies;
  metadata: IntentMetadata;
}

interface SignalIntentResponse {
  success: boolean;
  intentHash?: string;
  txHash?: string;
  error?: string;
}

interface FulfillAndOnrampRequest {
  amount: string;
  conversionRate: string;
  intentHash: `0x${string}`;
  onrampProof: Proof;
  currency: ZKP2PCurrencies;
  destinationUsername: string;
  destinationPlatform: PaymentPlatforms;
}

interface FulfillAndOnrampResponse {
  success: boolean;
  txHash?: string;
  depositId?: string;
  message?: string;
  error?: string;
}

/**
 * Signal intent on the blockchain via backend API
 * Replaces: samba.signalIntent()
 */
export async function signalIntent(
  quote: QuoteResponse,
  amount: string,
  verifier: `0x${string}`,
  currency: ZKP2PCurrencies,
  recipient: string,
  platform: PaymentPlatforms
): Promise<string> {
  const requestBody: SignalIntentRequest = {
    quote,
    amount,
    verifier,
    currency,
    metadata: {
      recipient,
      amount,
      platform,
    },
  };

  const response = await makeAuthenticatedRequest('/api/contract/signal', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  const data: SignalIntentResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to signal intent');
  }

  if (!data.intentHash) {
    throw new Error('Intent hash not returned from API');
  }

  return data.intentHash;
}

/**
 * Fulfill intent and execute onramp via backend API
 * Replaces: samba.fulfillAndOnramp()
 */
export async function fulfillAndOnramp(
  amount: string,
  conversionRate: string,
  intentHash: `0x${string}`,
  onrampProof: Proof,
  currency: ZKP2PCurrencies,
  destinationUsername: string,
  destinationPlatform: PaymentPlatforms
): Promise<string> {
  const requestBody: FulfillAndOnrampRequest = {
    amount,
    conversionRate,
    intentHash,
    onrampProof,
    currency,
    destinationUsername,
    destinationPlatform,
  };

  const response = await makeAuthenticatedRequest('/api/contract/onramp', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  const data: FulfillAndOnrampResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fulfill and onramp');
  }
  return data.depositId ? data.depositId : "";
}

/**
 * Cancel intent (placeholder - implement when needed)
 * Replaces: samba.cancelIntent()
 */
export async function cancelIntent(intentHash: `0x${string}`): Promise<void> {
  // TODO: Implement cancel intent API route if needed
  console.log('Cancel intent - to be implemented with backend API');
  throw new Error('Cancel intent not yet implemented in backend API');
}

/**
 * Helper to check if backend APIs are available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/contract/signal');
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}