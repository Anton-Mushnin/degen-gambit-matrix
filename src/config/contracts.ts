// Contract addresses for different networks
export interface ContractConfig {
  matrixDice: string;
  degenGambit: string;
  evenOdd: string;
}

// Network configurations
export const contractAddresses: Record<number, ContractConfig> = {
  // Ethereum Mainnet
  1: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_MAINNET || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_MAINNET || '',
    evenOdd: import.meta.env.VITE_EVEN_ODD_MAINNET || '',
  },
  // Ethereum Sepolia Testnet
  11155111: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_SEPOLIA || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_SEPOLIA || '',
    evenOdd: import.meta.env.VITE_EVEN_ODD_SEPOLIA || '',
  },
  // Polygon Mainnet
  137: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_POLYGON || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_POLYGON || '',
    evenOdd: import.meta.env.VITE_EVEN_ODD_POLYGON || '',
  },
  // Polygon Mumbai Testnet
  80001: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_MUMBAI || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_MUMBAI || '',
    evenOdd: import.meta.env.VITE_EVEN_ODD_MUMBAI || '',
  },
  // G7 Testnet
  13746: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_G7_TESTNET || '',
    degenGambit: '0xf3BE777A6096E0ff568296aD3BA76811b5b1Fc40', // Existing DegenGambit
    evenOdd: import.meta.env.VITE_EVEN_ODD_G7_TESTNET || '',
  },
  // Xai Testnet v2
  37714555429: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_XAI_TESTNET || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_XAI_TESTNET || '',
    evenOdd: '0x6aEEccD5eB7f9bABA25F052d0608CC4E162786B8', // Deployed EvenOdd
  },
  // Localhost/Hardhat
  31337: {
    matrixDice: import.meta.env.VITE_MATRIX_DICE_LOCALHOST || '',
    degenGambit: import.meta.env.VITE_DEGEN_GAMBIT_LOCALHOST || '',
    evenOdd: import.meta.env.VITE_EVEN_ODD_LOCALHOST || '',
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
export { degenGambitABI } from '../ABIs/DegenGambit.abi';
export { evenOddABI } from '../games/even-odd/contract/EvenOdd.abi';

// Helper to check if a contract is deployed on the current network
export function isContractDeployed(chainId: number, contract: keyof ContractConfig): boolean {
  try {
    const address = getContractAddress(chainId, contract);
    return address !== '' && address !== '0x0000000000000000000000000000000000000000';
  } catch {
    return false;
  }
}

// Helper function specifically for EvenOdd contract
export function getEvenOddAddress(chainId: number): string {
  return getContractAddress(chainId, 'evenOdd');
}

// Check if EvenOdd is deployed on a specific network
export function isEvenOddDeployed(chainId: number): boolean {
  return isContractDeployed(chainId, 'evenOdd');
} 