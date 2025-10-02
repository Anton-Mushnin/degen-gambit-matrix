import { GameContractConfig } from '../../../utils/gameConfig';
import { diceStreakABI } from '../../../ABIs/DiceStreak.abi';
import { diceStreakDevABI } from '../../../ABIs/DiceStreakDev.abi';

// DiceStreak contract configuration - single source of truth
export const diceStreakConfig: GameContractConfig = {
  production: {
    contractAddress: "0x2E1C39c9475C62f17493ABaFaFf90eD01640ce51",
    name: "DiceStreak",
    abi: diceStreakABI
  },
  dev: {
    contractAddress: "0xa6054a4962Ade70f4e70809e494F5811a00dcca3",
    name: "DiceStreakDev",
    abi: diceStreakDevABI
  },
  network: {
    name: "XAI Testnet",
    chainId: 37714555429,
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://testnet-explorer-v2.xai-chain.net/"
  }
};
