import { GameContractConfig } from '../../../utils/gameConfig';
import { guessNextNumberABI } from '../contractFunctions/GuessNextNumber.abi';

// GuessNextNumber contract configuration
export const guessNextNumberConfig: GameContractConfig = {
  production: {
    contractAddress: "0xC4B3b40d3F458Ff8E62a686bA2ee5ee38Ef63A7F",
    name: "GuessNextNumber",
    abi: guessNextNumberABI
  },
  dev: {
    contractAddress: "0xC4B3b40d3F458Ff8E62a686bA2ee5ee38Ef63A7F",
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

