// Contract addresses for different networks
export interface ContractConfig {
  matrixDice: string;
  degenGambit: string;
}

// Network configurations
export const contractAddresses: Record<number, ContractConfig> = {
  // Ethereum Mainnet
  1: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_MAINNET || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_MAINNET || '',
  },
  // Ethereum Sepolia Testnet
  11155111: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_SEPOLIA || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_SEPOLIA || '',
  },
  // Polygon Mainnet
  137: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_POLYGON || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_POLYGON || '',
  },
  // Polygon Mumbai Testnet
  80001: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_MUMBAI || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_MUMBAI || '',
  },
  // G7 Testnet
  13746: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_G7_TESTNET || '',
    degenGambit: '0xf3BE777A6096E0ff568296aD3BA76811b5b1Fc40', // Existing DegenGambit
  },
  // Localhost/Hardhat
  31337: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_LOCALHOST || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_LOCALHOST || '',
  },
};

// Get contract address for current network
export function getContractAddress(chainId: number, contract: keyof ContractConfig): string {
  const config = contractAddresses[chainId];
  if (!config) {
    throw new Error(`No contract configuration found for chain ID ${chainId}`);
  }
  
  const address = config[contract];
  if (!address) {
    throw new Error(`No ${contract} contract address found for chain ID ${chainId}`);
  }
  
  return address;
}

// Load contract addresses from deployment files (for development)
export async function loadDeploymentAddresses(): Promise<void> {
  try {
    // Try to load from deployment files
    const networks = ['localhost', 'g7-testnet', 'sepolia', 'mumbai', 'polygon', 'mainnet'];
    
    for (const network of networks) {
      try {
        const deploymentModule = await import(`../../deployments/matrix-dice-${network}.json`);
        const deployment = deploymentModule.default || deploymentModule;
        
        if (deployment.contractAddress) {
          // Map network names to chain IDs
          const chainIds: Record<string, number> = {
            'localhost': 31337,
            'g7-testnet': 13746,
            'sepolia': 11155111,
            'mumbai': 80001,
            'polygon': 137,
            'mainnet': 1,
          };
          
          const chainId = chainIds[network];
          if (chainId && contractAddresses[chainId]) {
            contractAddresses[chainId].matrixDice = deployment.contractAddress;
            console.log(`Loaded Matrix Dice address for ${network}: ${deployment.contractAddress}`);
          }
        }
      } catch (error) {
        // Deployment file doesn't exist, skip
        console.log(`No deployment file found for ${network}`);
      }
    }
  } catch (error) {
    console.log('Could not load deployment addresses:', error);
  }
}

// Contract ABIs
export { matrixDiceABI } from '../ABIs/MatrixDice.abi';
export { degenGambitABI } from '../ABIs/DegenGambit.abi';

// Helper to check if a contract is deployed on the current network
export function isContractDeployed(chainId: number, contract: keyof ContractConfig): boolean {
  try {
    const address = getContractAddress(chainId, contract);
    return address !== '' && address !== '0x0000000000000000000000000000000000000000';
  } catch {
    return false;
  }
} 