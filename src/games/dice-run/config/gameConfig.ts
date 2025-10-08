import { GameContractConfig } from '../../../utils/gameConfig';
import { diceRunABI } from '../../../ABIs/DiceRun.abi';

export const diceRunConfig: GameContractConfig = {
  production: {
    contractAddress: "0xd9003e6a1358670d97800881486e0d63afAcF533", // XAI testnet deployment with totalWithdrawals and totalEarnings calculation
    name: "DiceRun",
    abi: diceRunABI
  },
  dev: {
    contractAddress: "0xd9003e6a1358670d97800881486e0d63afAcF533", // Same as production for now
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
