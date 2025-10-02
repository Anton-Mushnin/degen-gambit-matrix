import { GameContractConfig } from '../../../utils/gameConfig';
import { degenGambitABI } from '../../../ABIs/DegenGambit.abi';
import { devDegenGambitABI } from '../../../ABIs/DevDegenGambit.abi';

// DegenGambit contract configuration - single source of truth
export const degenGambitConfig: GameContractConfig = {
  production: {
    contractAddress: "0xE01c848c4b5e4Ac90746cd7bef27aEF23c9fcEa6",
    name: "DegenGambit",
    abi: degenGambitABI
  },
  dev: {
    contractAddress: "0xE01c848c4b5e4Ac90746cd7bef27aEF23c9fcEa6", // Same for now, update when dev contract is deployed
    name: "DevDegenGambit",
    abi: devDegenGambitABI
  },
  network: {
    name: "XAI Testnet",
    chainId: 37714555429,
    rpc: "https://testnet-v2.xai-chain.net/rpc",
    explorer: "https://testnet-explorer-v2.xai-chain.net/"
  }
};
