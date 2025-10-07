import { GameContractConfig } from '../../../utils/gameConfig';
import { diceStreakABI } from '../../../ABIs/DiceStreak.abi';
import { diceStreakDevABI } from '../../../ABIs/DiceStreakDev.abi';

// DiceStreak contract configuration - single source of truth
export const diceStreakConfig: GameContractConfig = {
  production: {
    contractAddress: "0x23066eB3Bb3c32aa6E1592F4c38ABb3D9f29f7b6",
    name: "DiceStreak",
    abi: diceStreakABI
  },
  dev: {
    contractAddress: "0x90bB634068fbB74aeA633982B9C747342A5D270E",
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
