import { GameContractConfig } from '../../../utils/gameConfig';
import { diceStreakABI } from '../../../ABIs/DiceStreak.abi';
import { diceStreakDevABI } from '../../../ABIs/DiceStreakDev.abi';

// DiceStreak contract configuration - single source of truth
export const diceStreakConfig: GameContractConfig = {
  production: {
    contractAddress: "0x57AF8f9EA5d9D6741ff45dc7d4E13BA13dbAEC27",
    name: "DiceStreak",
    abi: diceStreakABI
  },
  dev: {
    contractAddress: "0x02E87BC88bf8617b13238DBa40DF589ceAc9a2a0",
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
