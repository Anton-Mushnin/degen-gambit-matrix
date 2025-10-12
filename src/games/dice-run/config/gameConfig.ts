import { GameContractConfig } from '../../../utils/gameConfig';
import { diceRunABI } from '../contractFunctions/DiceRun.abi';
import { diceRunDevABI } from '../contractFunctions/DiceRunDev.abi';

export const diceRunConfig: GameContractConfig = {
  production: {
    contractAddress: "0xd9003e6a1358670d97800881486e0d63afAcF533", // XAI testnet deployment with totalWithdrawals and totalEarnings calculation
    name: "DiceRun",
    abi: diceRunABI
  },
  dev: {
    contractAddress: "0x26a1eeE5D29C116703FCa09707B12ec25CefDE28", // DiceRunDev contract
    name: "DiceRunDev",
    abi: diceRunDevABI
  },
  network: {
    name: "XAI Testnet",
    chainId: 37714555429,
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://testnet-explorer-v2.xai-chain.net/"
  }
};
