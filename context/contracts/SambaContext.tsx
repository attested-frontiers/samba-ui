import * as React from 'react';
import { createContext, useContext, useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getContract, parseEventLogs, parseUnits, zeroAddress } from 'viem';
import WrapperArtifact from '@/lib/artifacts/Wrapper.json';
import {
  IntentSignalRequest,
  PaymentPlatforms,
  QuoteResponse,
  SignalIntentResponse,
  ZKP2PCurrencies,
} from '@/lib/types/intents';
import { currencyKeccak256 } from '@/lib/chain';
import { encodeProofAsBytes, parseExtensionProof, Proof } from '@/lib/types';
import { getMarketMakerMetadataPayload, platformToVerifier } from '@/lib/utils';
import { ethers } from 'ethers';

const sambaContractAddress = process.env
  .NEXT_PUBLIC_SAMBA_CONTRACT as `0x${string}`;
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
  ? process.env.NEXT_PUBLIC_CHAIN_ID
  : 31337;

function calculateConvertedAmount(
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

interface SambaContractContextProps {
  sambaContract: any | null;
  cancelIntent: (intentHash: `0x${string}`) => Promise<void>;
  signalIntent: (
    quote: QuoteResponse,
    amount: string,
    verifier: `0x${string}`,
    currency: ZKP2PCurrencies
  ) => Promise<string>;
  fulfillAndOnramp: (
    amount: string,
    conversionRate: string,
    intentHash: `0x${string}`,
    onrampProof: Proof,
    currency: ZKP2PCurrencies,
    destinationUsername: string,
    destinationPlatform: PaymentPlatforms
  ) => Promise<void>;
}

const SambaContractContext = createContext<SambaContractContextProps>({
  sambaContract: null,
  cancelIntent: async () => {},
  signalIntent: async () => '',
  fulfillAndOnramp: async () => {},
});

export const SambaContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const contract = useMemo(() => {
    if (!publicClient) return null;

    let sambaContract = getContract({
      address: sambaContractAddress,
      abi: WrapperArtifact.abi,
      client: publicClient,
    });

    // If wallet is connected, create contracts with wallet client for write operations
    if (walletClient) {
      const sambaContract = getContract({
        address: sambaContractAddress,
        abi: WrapperArtifact.abi,
        client: { public: publicClient, wallet: walletClient },
      });

      return sambaContract;
    }

    return sambaContract;
  }, [publicClient, walletClient]);

  // Contract functions
  const contractFunctions = useMemo(() => {
    const cancelIntent = async (intentHash: `0x${string}`): Promise<void> => {
      if (!contract) {
        throw new Error('Samba contract not available');
      }
      try {
        const simulationResult = await contract.simulate.cancelIntent([
          intentHash,
        ]);
        console.log('Simulation successful:', simulationResult);
      } catch (error) {
        console.error('Error canceling intent onchain:', error);
        throw error;
      }
    };

    const signalIntent = async (
      quote: QuoteResponse,
      amount: string,
      verifier: `0x${string}`,
      currency: ZKP2PCurrencies
    ): Promise<string> => {
      if (!contract) {
        throw new Error('Samba contract not available');
      }
      // calculate amount after conversion rate
      const amountFormatted = parseUnits(amount, 6);
      const amountConverted = calculateConvertedAmount(
        amountFormatted.toString(),
        quote.intent.conversionRate
      );
      // Generate the currency hash
      const currencyHash = currencyKeccak256(currency);
      const depositId = quote.intent.intent.depositId.toString();
      const payload: IntentSignalRequest = {
        processorName: quote.intent.paymentMethod,
        depositId: depositId,
        tokenAmount: amountConverted,
        payeeDetails: quote.details.hashedOnchainId,
        toAddress: sambaContractAddress,
        fiatCurrencyCode: currencyHash,
        chainId: chainId.toString(),
      };

      console.log('Signal Intent Payload:', payload);

      // get the gating service signature from the api
      let gatingServiceSignature = '';
      try {
        console.log('Payload: ', payload);
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
        const data: SignalIntentResponse = await response.json();
        gatingServiceSignature =
          data.responseObject.intentData.gatingServiceSignature;
      } catch (error) {
        console.error('Error getting gating service signature:', error);
        throw error;
      }

      // signal intent onchain
      try {
        console.log('Attempting to signal intent');
        const simulationResult = await contract.simulate.signalIntent([
          depositId,
          amountConverted,
          verifier,
          currencyHash,
          gatingServiceSignature,
        ]);
        console.log('Simulation successful:', simulationResult);
        const txHash = await contract.write.signalIntent([
          depositId,
          amountConverted,
          verifier,
          currencyHash,
          gatingServiceSignature,
        ]);
        console.log('Transaction hash:', txHash);

        const receipt = await publicClient!.waitForTransactionReceipt({
          hash: txHash,
        });
        const intentLog = parseEventLogs({
          abi: WrapperArtifact.abi,
          logs: receipt.logs,
          eventName: 'IntentSignaled',
        });
        if (intentLog.length === 0) {
          throw new Error(
            'IntentSignaled event not found in transaction receipt'
          );
        }
        const intentHash = intentLog[0].topics[3];
        return intentHash as `0x${string}`;
      } catch (error) {
        console.error('Error signaling intent onchain:', error);
        throw error;
      }
    };

    const fulfillAndOnramp = async (
      amount: string,
      conversionRate: string,
      intentHash: `0x${string}`,
      onrampProof: Proof,
      currency: ZKP2PCurrencies,
      destinationUsername: string,
      destinationPlatform: PaymentPlatforms
    ): Promise<void> => {
      console.log('Proof: ', onrampProof);
      console.log('Intent hash: ', intentHash);
      if (!contract) {
        throw new Error('Samba contract not available');
      }
      // get the payee details hash
      const marketMakerMetadataPayload = getMarketMakerMetadataPayload(
        destinationUsername,
        destinationPlatform
      );
      console.log('Market Maker Metadata Payload:', marketMakerMetadataPayload);
      let payeeDetailsHash: string;
      try {
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
        payeeDetailsHash = await response
          .json()
          .then((data) => data.hashedOnchainId);
      } catch (error) {
        console.error('Error validating market maker:', error);
        throw error;
      }
      // Generate the currency hash
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
          intentGatingService: process.env.NEXT_PUBLIC_INTENTS_GATING_ADDRESS!,
          payeeDetails: payeeDetailsHash,
          data: ethers.utils.defaultAbiCoder.encode(
            ['address[]'],
            [['0x0636c417755E3ae25C6c166D181c0607F4C572A3']]
          ),
        },
      ];
      // get verifier address
      const verifier = platformToVerifier(destinationPlatform);
      const offrampIntent = {
        verifiers: [verifier],
        data: verifierData,
        currencies: currencyWithRate,
      };
      try {
        const simulationResult = await contract.simulate.fulfillAndOfframp([
          amountConverted,
          intentHash,
          encodedProof,
          offrampIntent,
        ]);
        console.log('Simulation successful:', simulationResult);
        const txHash = await contract.write.fulfillAndOfframp([
          amountConverted,
          intentHash,
          encodedProof,
          offrampIntent,
        ]);
        console.log('Transaction hash:', txHash);
        await publicClient!.waitForTransactionReceipt({
          hash: txHash,
        });
        console.log('Onramp Confirmed, Offramp Queued');
      } catch (error: any) {
        console.error('=== DETAILED ERROR LOGGING ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        // Check for specific error types
        if (error.name === 'ContractFunctionRevertedError') {
          console.error('Contract reverted!');
          console.error('Revert reason:', error.data?.errorName || 'Unknown');
          console.error('Short message:', error.shortMessage);
          console.error('Error data:', error.data);
        }
        // Log additional error properties
        if (error.details) {
          console.error('Error details:', error.details);
        }
        if (error.cause) {
          console.error('Error cause:', error.cause);
        }
        // Log the full error object to see all available properties
        console.error(
          'Full error object:',
          JSON.stringify(
            error,
            (key, value) => {
              // Handle circular references and functions
              if (typeof value === 'function') return '[Function]';
              if (typeof value === 'object' && value !== null) {
                if (value.constructor && value.constructor.name !== 'Object') {
                  return `[${value.constructor.name}]`;
                }
              }
              return value;
            },
            2
          )
        );
        // Also log error stack for debugging
        console.error('Error stack:', error.stack);
        throw error;
      }
    };

    return {
      cancelIntent,
      signalIntent,
      fulfillAndOnramp,
    };
  }, [contract, walletClient, publicClient]);

  const contextValue: SambaContractContextProps = {
    sambaContract: contract || null,
    ...contractFunctions,
  };

  return (
    <SambaContractContext.Provider value={contextValue}>
      {children}
    </SambaContractContext.Provider>
  );
};

export const useSambaContract = () => useContext(SambaContractContext);
