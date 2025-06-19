import React, { createContext, useContext, useEffect } from 'react';
import { useWalletClient } from 'wagmi';
import { useSambaContract } from '@/context/contracts/SambaContext';
import { useEscrowContract } from '@/context/contracts/EscrowContext';
import { useUSDCContract } from '@/context/contracts/USDCContext';
import { ANVIL_CHAIN } from '@/lib/chain';


// Combined interface that includes all contract contexts
interface ContractsContextProps {
    samba: ReturnType<typeof useSambaContract>;
    escrow: ReturnType<typeof useEscrowContract>;
    usdc: ReturnType<typeof useUSDCContract>;

    // Additional combined functionality
    isAllContractsReady: boolean;
}

const ContractsContext = createContext<ContractsContextProps | null>(null);

// This provider wraps around your individual contract providers
export const ContractsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const samba = useSambaContract();
    const escrow = useEscrowContract();
    const usdc = useUSDCContract();

    const { data: walletClient } = useWalletClient();

    // Derived state
    const isAllContractsReady = !!(samba.sambaContract && escrow.escrowContract && usdc.usdcContract);


    const contextValue: ContractsContextProps = {
        samba,
        escrow,
        usdc,
        isAllContractsReady,
    };

    useEffect(() => {
        const checkAndSwitchChain = async () => {

            if (!walletClient) return;

            const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');
            const currentChainId = walletClient.chain?.id;

            if (currentChainId && currentChainId !== expectedChainId) {
                try {
                    await walletClient.switchChain({ id: expectedChainId });
                } catch (error: any) {
                    if (error.code && error.code === 4902) {
                        try {
                            await walletClient.addChain({
                                chain: ANVIL_CHAIN
                            });
                            await walletClient.switchChain({ id: expectedChainId });
                        } catch (error) {
                            console.error('Failed to add or switch chain:', error);
                        }
                    } else {
                        console.error('Failed to switch chain:', error);
                    }
                }
            }
        };

        checkAndSwitchChain();
    }, [walletClient]);

    return (
        <ContractsContext.Provider value={contextValue}>
            {children}
        </ContractsContext.Provider>
    );
};

export const useContracts = () => {
    const context = useContext(ContractsContext);
    if (!context) {
        throw new Error('useContracts must be used within ContractsProvider');
    }
    return context;
};

// Optional: Individual access helpers for convenience
export const useSambaFromCombined = () => {
    const { samba } = useContracts();
    return samba;
};

export const useEscrowFromCombined = () => {
    const { escrow } = useContracts();
    return escrow;
};

export const useUSDCFromCombined = () => {
    const { usdc } = useContracts();
    return usdc;
};