import * as React from "react";
import { createContext, useContext, useMemo } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { getContract, parseEventLogs, parseUnits, zeroAddress } from "viem";
import WrapperArtifact from "@/lib/artifacts/Wrapper.json";
import { Intent, PaymentPlatforms, ZKP2PCurrencies } from "@/lib/types/intents";
import { ANVIL_CHAIN, currencyKeccak256 } from "@/lib/chain";
import { encodeProofAsBytes, parseExtensionProof, Proof } from "@/lib/types";
import { getMarketMakerMetadataPayload } from "@/lib/utils";
import { ethers } from "ethers";



const sambaContractAddress = process.env.NEXT_PUBLIC_SAMBA_CONTRACT as `0x${string}`;
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    ? process.env.NEXT_PUBLIC_CHAIN_ID
    : 31337;

interface SambaContractContextProps {
    sambaContract: any | null;
    signalIntent: (
        depositId: number,
        amount: string,
        verifier: `0x${string}`,
        currency: ZKP2PCurrencies
    ) => Promise<string>;
    fulfillAndOnramp: (
        amount: string,
        intentHash: `0x${string}`,
        onrampProof: Proof,
        verifier: `0x${string}`,
        currency: ZKP2PCurrencies,
        destinationUsername: string,
        destinationPlatform: PaymentPlatforms
    ) => Promise<void>;
}

const SambaContractContext = createContext<SambaContractContextProps>({
    sambaContract: null,
    signalIntent: async () => "",
    fulfillAndOnramp: async () => { },
});

export const SambaContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

            return sambaContract
        }

        return sambaContract
    }, [publicClient, walletClient]);

    // Contract functions
    const contractFunctions = useMemo(() => {
        const signalIntent = async (
            depositId: number,
            amount: string,
            verifier: `0x${string}`,
            currency: ZKP2PCurrencies,
        ): Promise<string> => {
            if (!contract) {
                throw new Error("Samba contract not available");
            }
            // Generate the currency hash
            const currencyHash = currencyKeccak256(currency);
            const amountFormatted = parseUnits(amount, 6);

            const payload: Intent = {
                depositId: depositId.toString(),
                amount: amountFormatted.toString(),
                to: sambaContractAddress,
                verifier,
                fiatCurrency: currencyHash,
                chainId: chainId.toString()
            }

            console.log("Intent: ", payload);
            // get the gating service signature from the api
            let gatingServiceSignature = "";
            try {
                const response = await fetch("/api/gating", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error from Gating Service API:', errorData);
                    throw new Error('Error getting gating service signature');
                }
                const data = await response.json();
                gatingServiceSignature = data.signature;
            } catch (error) {
                console.error("Error getting gating service signature:", error);
                throw error;
            }

            // signal intent onchain
            try {
                console.log("Attempting to signal intent");

                const txHash = await contract.write.signalIntent([
                    depositId,
                    amountFormatted,
                    verifier,
                    currencyHash,
                    gatingServiceSignature
                ]);
                console.log("Transaction hash:", txHash);

                const receipt = await publicClient!.waitForTransactionReceipt({
                    hash: txHash
                });
                const intentLog = parseEventLogs({
                    abi: WrapperArtifact.abi,
                    logs: receipt.logs,
                    eventName: "IntentSignaled",
                });
                if (intentLog.length === 0) {
                    throw new Error("IntentSignaled event not found in transaction receipt");
                }
                const intentHash = intentLog[0].topics[3];
                return intentHash as `0x${string}`;
            } catch (error) {
                console.error("Error signaling intent onchain:", error);
                throw error;
            };
        }

        const fulfillAndOnramp = async (
            amount: string,
            intentHash: `0x${string}`,
            onrampProof: Proof,
            verifier: `0x${string}`,
            currency: ZKP2PCurrencies,
            destinationUsername: string,
            destinationPlatform: PaymentPlatforms
        ): Promise<void> => {
            if (!contract) {
                throw new Error("Samba contract not available");
            }
            // get the payee details hash
            const marketMakerMetadataPayload = getMarketMakerMetadataPayload(
                destinationUsername,
                destinationPlatform
            );
            console.log("Market Maker Metadata Payload:", marketMakerMetadataPayload);
            let payeeDetailsHash: string;
            try {
                const response = await fetch("/api/deposits/validate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(marketMakerMetadataPayload),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error from ZKP2P API:', errorData);
                    throw new Error('Error validating market maker with ZKP2P');
                }
                payeeDetailsHash = await response.json()
                    .then(data => data.hashedOnchainId);
            } catch (error) {
                console.error("Error validating market maker:", error);
                throw error;
            }
            // Generate the currency hash
            const currencyWithRate = [[{
                code: currencyKeccak256(currency),
                conversionRate: ethers.utils.parseUnits('1'),
            }]];

            // Format the amount
            const amountFormatted = parseUnits(amount, 6);
            // Prepare the proof
            const parsedProof = parseExtensionProof(onrampProof);
            const encodedProof = encodeProofAsBytes(parsedProof);
            // Prepare verifier data
            const verifierData = [{
                // intentGatingService: DEV_ACCOUNTS.gating.pub,
                intentGatingService: zeroAddress,
                payeeDetails: payeeDetailsHash,
                data: ethers.utils.defaultAbiCoder.encode(
                    ['address[]'],
                    [['0x0636c417755E3ae25C6c166D181c0607F4C572A3']]
                )
            }];
            const offrampIntent = {
                verifiers: [verifier],
                data: verifierData,
                currencies: currencyWithRate
            }
            try {
                // // const txHash = await contract.write.fulfillAndOfframp([
                // //     amountFormatted,
                // //     intentHash,
                // //     encodedProof,
                // //     offrampIntent,
                // // ]);
                // console.log("Transaction hash:", txHash);
                // await publicClient!.waitForTransactionReceipt({
                //     hash: txHash
                // });
                // console.log("Onramp Confirmed, Offramp Queued");
            } catch (error) {
                console.error("Error fulfilling and onramping:", error);
                throw error;
            }
        };

        return {
            signalIntent,
            fulfillAndOnramp
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