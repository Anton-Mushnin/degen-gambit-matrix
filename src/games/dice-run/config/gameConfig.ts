import { GameContractConfig } from '../../../utils/gameConfig';
import { diceRunABI } from '../contractFunctions/DiceRun.abi';
import { diceRunDevABI } from '../contractFunctions/DiceRunDev.abi';

export const diceRunConfig: GameContractConfig = {
  production: {
    contractAddress: "0x45e19BBa0Cb49eA06C8e97b2dB07A535C9a17aa1", // XAI testnet deployment with balanced parameters (5.9x payout, 5%/12%/24%/50% streak shares)
    name: "DiceRun",
    abi: diceRunABI
  },
  dev: {
    contractAddress: "0x2a01be49C99895ec056dF2c947d4C617974A6B36", // DiceRunDev contract with balanced parameters (5.9x payout, 5%/12%/24%/50% streak shares)
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
