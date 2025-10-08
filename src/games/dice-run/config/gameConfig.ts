import { GameContractConfig } from '../../../utils/gameConfig';
import { diceRunABI } from '../../../ABIs/DiceRun.abi';

export const diceRunConfig: GameContractConfig = {
  production: {
    contractAddress: "0x2Ec468cC828E34dB4e401E8249c09752E7a4c66a", // XAI testnet deployment with getCurrentShareValue function
    name: "DiceRun",
    abi: diceRunABI
  },
  dev: {
    contractAddress: "0x2Ec468cC828E34dB4e401E8249c09752E7a4c66a", // Same as production for now
    name: "DiceRun",
    abi: diceRunABI
  },
  network: {
    name: "XAI Testnet",
    chainId: 37714555429,
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://testnet-explorer-v2.xai-chain.net/"
  }
};
