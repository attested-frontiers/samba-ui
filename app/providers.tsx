"use client"

import type React from "react"

import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { config } from "./config"
import { ExtensionProxyProofsProvider } from "@/context/reclaim"
import { ContractsProvider } from "@/context/contracts"
import { SambaContractProvider } from "@/context/contracts/SambaContext"
import { EscrowContractProvider } from "@/context/contracts/EscrowContext"
import { USDCContractProvider } from "@/context/contracts/USDCContext"


const queryClient = new QueryClient()


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ExtensionProxyProofsProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <SambaContractProvider>
            <EscrowContractProvider>
              <USDCContractProvider>
                <ContractsProvider>
                  {children}
                </ContractsProvider>
              </USDCContractProvider>
            </EscrowContractProvider>
          </SambaContractProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ExtensionProxyProofsProvider>
  )
}
