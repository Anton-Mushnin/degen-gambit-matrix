import { GameContractConfig } from '../../../utils/gameConfig';
import { diceRunABI } from '../../../ABIs/DiceRun.abi';

export const diceRunConfig: GameContractConfig = {
  production: {
    contractAddress: "0x6F69eDa03a207bfbBb14bAB1569034C7a2Cb3eC7",
    name: "DiceRun",
    abi: diceRunABI
  },
  dev: {
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Local deployment with fixed payout multiplier
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
