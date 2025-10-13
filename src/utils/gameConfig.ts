// Utility functions for game configuration based on dev mode

export interface GameContractConfig {
  production: {
    contractAddress: string;
    name: string;
    abi?: any;
  };
  dev: {
    contractAddress: string;
    name: string;
    abi?: any;
  };
  network?: {
    name: string;
    chainId: number;
    rpc: string;
    explorer: string;
  };
  [key: string]: unknown;
}

export interface GameConfigResult {
  contractAddress: string;
  contractName: string;
  abi?: any;
}

/**
 * Get the appropriate contract configuration based on dev mode
 */
export function getGameConfig(
  config: GameContractConfig,
  isDevMode: boolean,
  defaultAbi?: any
): GameConfigResult {
  const mode = isDevMode ? 'dev' : 'production';
  const modeConfig = config[mode];
  
  return {
    contractAddress: modeConfig.contractAddress,
    contractName: modeConfig.name,
    abi: modeConfig.abi || defaultAbi
  };
}

/**
 * Hook-like function to get game config with dev mode awareness
 * This can be used in React components that have access to dev mode context
 */
export function useGameConfig(
  config: GameContractConfig,
  isDevMode: boolean,
  defaultAbi?: any
): GameConfigResult {
  return getGameConfig(config, isDevMode, defaultAbi);
}
