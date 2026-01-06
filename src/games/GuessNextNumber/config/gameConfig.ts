import { GameContractConfig } from '../../../utils/gameConfig';
import { guessNextNumberABI } from '../contractFunctions/GuessNextNumber.abi';

// GuessNextNumber contract configuration
export const guessNextNumberConfig: GameContractConfig = {
  production: {
    contractAddress: "0x9C6250335B3f3ec592fE988D4EFD61BEB733d428",
    name: "GuessNextNumber",
    abi: guessNextNumberABI
  },
  dev: {
    contractAddress: "0x9C6250335B3f3ec592fE988D4EFD61BEB733d428",
    name: "GuessNextNumber",
    abi: guessNextNumberABI
  },
  network: {
    name: "XAI Testnet",
    chainId: 37714555429,
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://testnet-explorer-v2.xai-chain.net/"
  }
};

