// EvenOdd Game Constants

// Contract Configuration
export const EVEN_ODD_CONFIG = {
  BET_AMOUNT: 1000, // WEI
  WIN_PAYOUT: 1400, // WEI (1.4x multiplier)
  REVEAL_DELAY: 3, // blocks
  REVEAL_WINDOW: 256, // blocks (after which bet is forfeited)
} as const;

// Network Deployments
export const EVEN_ODD_DEPLOYMENTS = {
  // Xai Testnet v2
  37714555429: {
    chainId: 37714555429,
    name: 'Xai Testnet v2',
    address: '0x6aEEccD5eB7f9bABA25F052d0608CC4E162786B8',
    explorer: 'https://sepolia.xaiscan.io',
    rpc: 'https://testnet-v2.xai-chain.net/rpc',
    deployedAt: '2025-01-16',
    deployer: '0x4eD919172bD08D74831f2914aAAe8edA690d08Ab',
  },
} as const;

// Game Mechanics
export const GAME_MECHANICS = {
  CHOICES: {
    ODD: true,
    EVEN: false,
  },
  PHASES: {
    COMMIT: 'commit',
    WAITING: 'waiting', 
    REVEAL: 'reveal',
    RESULT: 'result',
  },
  FREE_SPIN: {
    ENABLED: true,
    SAME_CHOICE_REQUIRED: true,
    NO_COST: true,
  },
} as const;

// Helper function to get contract address for a chain
export function getEvenOddContractAddress(chainId: number): string | null {
  const deployment = EVEN_ODD_DEPLOYMENTS[chainId as keyof typeof EVEN_ODD_DEPLOYMENTS];
  return deployment?.address || null;
}

// Check if EvenOdd is deployed on a specific chain
export function isEvenOddSupportedChain(chainId: number): boolean {
  return chainId in EVEN_ODD_DEPLOYMENTS;
}

// Get deployment info for a specific chain
export function getEvenOddDeployment(chainId: number) {
  return EVEN_ODD_DEPLOYMENTS[chainId as keyof typeof EVEN_ODD_DEPLOYMENTS] || null;
} 