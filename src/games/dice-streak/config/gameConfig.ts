import { GameContractConfig } from '../../../utils/gameConfig';
import { diceStreakABI } from '../../../ABIs/DiceStreak.abi';
import { diceStreakDevABI } from '../../../ABIs/DiceStreakDev.abi';

// DiceStreak contract configuration - single source of truth
export const diceStreakConfig: GameContractConfig = {
  production: {
    contractAddress: "0xEf3501Dd76C1F1F15058fb248E980fD3f70C1F2f",
    name: "DiceStreak",
    abi: diceStreakABI
  },
  dev: {
    contractAddress: "0xf7bc92C61D12A7Fa51C8609EB57dF0ae244d19Cc",
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
