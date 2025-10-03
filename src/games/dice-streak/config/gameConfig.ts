import { GameContractConfig } from '../../../utils/gameConfig';
import { diceStreakABI } from '../../../ABIs/DiceStreak.abi';
import { diceStreakDevABI } from '../../../ABIs/DiceStreakDev.abi';

// DiceStreak contract configuration - single source of truth
export const diceStreakConfig: GameContractConfig = {
  production: {
    contractAddress: "0xA80a04Ce901fefE86418b2E6452E6a594a4c140C",
    name: "DiceStreak",
    abi: diceStreakABI
  },
  dev: {
    contractAddress: "0x0e9466BB274dB751c1F89523Ecb387e8B165a74f",
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
