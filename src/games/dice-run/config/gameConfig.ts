import { GameContractConfig } from '../../../utils/gameConfig';
import { diceRunABI } from '../../../ABIs/DiceRun.abi';

// DiceRun contract configuration - single source of truth
export const diceRunConfig: GameContractConfig = {
  production: {
    contractAddress: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
    name: "DiceRun",
    abi: diceRunABI
  },
  dev: {
    contractAddress: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
    name: "DiceRunDev",
    abi: diceRunABI // Same ABI for dev version
  },
  network: {
    name: "XAI Testnet",
    chainId: 37714555429,
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://testnet-explorer-v2.xai-chain.net/"
  }
};
