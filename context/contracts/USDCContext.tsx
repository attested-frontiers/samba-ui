import * as React from "react";
import { createContext, useContext, useMemo } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { getContract } from "viem";
import ERC20Artifact from "@/lib/artifacts/Escrow.json";

const {
    NEXT_PUBLIC_USDC_CONTRACT,
} = process.env;

const usdcContractAddress = NEXT_PUBLIC_USDC_CONTRACT as `0x${string}`;

interface USDCContractContextProps {
    usdcContract: any | null;
    getBalance: (address: `0x${string}`) => Promise<bigint>;
    approve: (spender: `0x${string}`, amount: bigint) => Promise<any>;
}

const USDCContractContext = createContext<USDCContractContextProps>({
    usdcContract: null,
    getBalance: async () => BigInt(0),
    approve: async () => null,
});

export const USDCContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const contract = useMemo(() => {
        if (!publicClient) return null;

        let usdcContract = getContract({
            address: usdcContractAddress,
            abi: ERC20Artifact.abi,
            client: publicClient,
        });

        // If wallet is connected, create contracts with wallet client for write operations
        if (walletClient) {
            const usdcContract = getContract({
                address: usdcContractAddress,
                abi: ERC20Artifact.abi,
                client: { public: publicClient, wallet: walletClient },
            });
            return usdcContract
        }

        return usdcContract
    }, [publicClient, walletClient]);

    // Contract functions
    const contractFunctions = useMemo(() => {
        const getBalance = async (address: `0x${string}`): Promise<bigint> => {
            if (!contract) {
                throw new Error("USDC contract not available");
            }
            try {
                return await contract.read.balanceOf([address]) as bigint;
            } catch (error) {
                console.error("Error getting USDC balance:", error);
                throw error;
            }
        };

        const approve = async (spender: `0x${string}`, amount: bigint) => {
            if (!contract) {
                throw new Error("USDC contract not available");
            }
            if (!walletClient) {
                throw new Error("Wallet not connected");
            }
            try {
                return await contract.write.approve([spender, amount]);
            } catch (error) {
                console.error("Error approving USDC:", error);
                throw error;
            }
        };

        return {
            getBalance,
            approve,
        };
    }, [contract, walletClient]);

    const contextValue: USDCContractContextProps = {
        usdcContract: contract || null,
        ...contractFunctions
    };

    return (
        <USDCContractContext.Provider value={contextValue}>
            {children}
        </USDCContractContext.Provider>
    );
};

export const useUSDCContract = () => useContext(USDCContractContext);