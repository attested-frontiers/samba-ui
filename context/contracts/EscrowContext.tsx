import * as React from "react";
import { createContext, useContext, useMemo } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { getContract } from "viem";
import ZKP2PArtifact from "@/lib/artifacts/Escrow.json";

const {
    NEXT_PUBLIC_ZKP2P_CONTRACT,
} = process.env;

const escrowContractAddress = NEXT_PUBLIC_ZKP2P_CONTRACT as `0x${string}`;

interface EscrowContractContextProps {
    escrowContract: any | null;
}

const EscrowContractContext = createContext<EscrowContractContextProps>({
    escrowContract: null,
});

export const EscrowContractProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const contract = useMemo(() => {
        if (!publicClient) return null;

        let escrowContract = getContract({
            address: escrowContractAddress,
            abi: ZKP2PArtifact.abi,
            client: publicClient,
        });

        // If wallet is connected, create contracts with wallet client for write operations
        if (walletClient) {

            const escrowContract = getContract({
                address: escrowContractAddress,
                abi: ZKP2PArtifact.abi,
                client: { public: publicClient, wallet: walletClient },
            });

            return escrowContract
        }

        return escrowContract
    }, [publicClient, walletClient]);

    const contextValue: EscrowContractContextProps = {
        escrowContract: contract || null,
    };

    return (
        <EscrowContractContext.Provider value={contextValue}>
            {children}
        </EscrowContractContext.Provider>
    );
};

export const useEscrowContract = () => useContext(EscrowContractContext);