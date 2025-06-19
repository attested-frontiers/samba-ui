import { ethers, BigNumber, Wallet } from 'ethers';
import { Intent } from './types/intents';
import { defineChain } from 'viem';

export const ANVIL_CHAIN = /*#__PURE__*/ defineChain({
  id: 31_337,
  name: 'Anvil Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
})


export const currencyKeccak256 = (inputString: string): string => {
  const bytes = ethers.utils.toUtf8Bytes(inputString);
  return ethers.utils.keccak256(bytes);
};

// generate gating service signature
export const generateGatingServiceSignature = async (
    signer: Wallet,
    intent: Intent
) => {
    console.log("Deposit ID: ", BigNumber.from(intent.depositId));
    console.log("Amount: ", BigNumber.from(intent.amount));
    console.log("To: ", intent.to);
    console.log("Verifier: ", intent.verifier);
    console.log("Fiat Currency: ", intent.fiatCurrency);
    console.log("Chain ID: ", BigNumber.from(intent.chainId));
    const messageHash = ethers.utils.solidityKeccak256(
        ["uint256", "uint256", "address", "address", "bytes32", "uint256"],
        [
            BigNumber.from(intent.depositId),
            BigNumber.from(intent.amount),
            intent.to,
            intent.verifier,
            intent.fiatCurrency,
            BigNumber.from(intent.chainId).toString()
        ]
    );
    return await signer.signMessage(ethers.utils.arrayify(messageHash));
}