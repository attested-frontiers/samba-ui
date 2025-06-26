import { ethers } from 'ethers';
import { createWalletClient, createPublicClient, http, getContract, parseEventLogs } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, mainnet } from 'viem/chains';
import { ANVIL_CHAIN } from './chain';
import WrapperArtifact from './artifacts/Wrapper.json';
import { getContractAddresses } from './contract-utils';

// FAKE CREDENTIALS - YOU WILL REPLACE WITH .env
const PRIVATE_KEY = `0x${process.env.BACKEND_PRIV_KEY!}` as `0x${string}`;
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ||
  'https://mainnet.base.org';
  
/**
 * Get the appropriate chain configuration
 */
function getChain() {
  const { chainId } = getContractAddresses();
  
  switch (chainId) {
    case '1':
      return mainnet;
    case '8453':
      return base;
    case '31337':
      return ANVIL_CHAIN;
    default:
      return base; // Default to Base
  }
}

/**
 * Create backend wallet and clients
 */
export function createBackendClients() {
  const chain = getChain();
  
  // Create account from private key
  const account = privateKeyToAccount(PRIVATE_KEY);
  
  // Create public client for reading
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  });
  
  // Create wallet client for writing
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(RPC_URL),
  });
  
  return { publicClient, walletClient, account };
}

/**
 * Create Samba contract instance
 */
export function createSambaContract() {
  const { publicClient, walletClient } = createBackendClients();
  const { samba: contractAddress } = getContractAddresses();
  
  return getContract({
    address: contractAddress,
    abi: WrapperArtifact.abi,
    client: { public: publicClient, wallet: walletClient },
  });
}

/**
 * Execute contract transaction with simulation
 */
export async function executeContractTransaction<T extends any[]>(
  contract: any,
  methodName: string,
  args: T,
  description: string = 'transaction'
): Promise<`0x${string}`> {
  try {
    console.log(`🔍 Simulating ${description}...`);
    
    // Simulate transaction first
    const simulationResult = await contract.simulate[methodName](args);
    console.log(`✅ ${description} simulation successful:`, simulationResult);
    
    // Execute the transaction
    console.log(`📝 Executing ${description}...`);
    const txHash = await contract.write[methodName](args);
    console.log(`🚀 ${description} transaction hash:`, txHash);
    
    return txHash;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    throw error;
  }
}

/**
 * Wait for transaction receipt and parse events
 */
export async function waitForTransactionReceipt(
  txHash: `0x${string}`,
  eventName?: string
): Promise<{ receipt: any; eventLogs?: any[] }> {
  const { publicClient } = createBackendClients();
  
  console.log(`⏳ Waiting for transaction receipt: ${txHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  
  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
  
  let eventLogs;
  if (eventName) {
    eventLogs = parseEventLogs({
      abi: WrapperArtifact.abi,
      logs: receipt.logs,
      eventName,
    });
    console.log(`📋 Parsed ${eventName} events:`, eventLogs);
  }
  
  return { receipt, eventLogs };
}

/**
 * Get account info for debugging
 */
export function getBackendAccountInfo() {
  const { account } = createBackendClients();
  return {
    address: account.address,
    // Don't log private key in production!
    privateKeyPreview: `${PRIVATE_KEY.slice(0, 6)}...${PRIVATE_KEY.slice(-4)}`,
  };
}