import { GameContractConfig } from '../../../utils/gameConfig';
import { diceRunABI } from '../../../ABIs/DiceRun.abi';

export const diceRunConfig: GameContractConfig = {
  production: {
    contractAddress: "0x60ac77EaCe9595927a9D75F3D3a24E417142c8D2", // XAI testnet deployment with totalWithdrawals and totalEarnings
    name: "DiceRun",
    abi: diceRunABI
  },
  dev: {
    contractAddress: "0x60ac77EaCe9595927a9D75F3D3a24E417142c8D2", // Same as production for now
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
