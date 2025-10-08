import { GameContractConfig } from '../../../utils/gameConfig';
import { diceRunABI } from '../../../ABIs/DiceRun.abi';

export const diceRunConfig: GameContractConfig = {
  production: {
    contractAddress: "0x68Eb405387D5D30cfeadEaA954859Be836157f88", // XAI testnet deployment with fixed payout multiplier
    name: "DiceRun",
    abi: diceRunABI
  },
  dev: {
    contractAddress: "0x68Eb405387D5D30cfeadEaA954859Be836157f88", // Same as production for now
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
