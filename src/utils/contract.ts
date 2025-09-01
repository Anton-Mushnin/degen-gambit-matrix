import { type PublicClient } from 'viem';

// On-place ABI for Even-Odd game contract
const EVEN_ODD_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getLastResult",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "playerHasCommit",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "hasCommit",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "playerHasFreeSpin",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "totalWinnings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "BET_AMOUNT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WIN_PAYOUT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract data getters for Even-Odd game - exported functions only
export async function getHasCommit(
  publicClient: PublicClient,
  contractAddress: string,
  playerAddress: string
): Promise<boolean> {
  const result = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: EVEN_ODD_ABI,
    functionName: 'playerHasCommit',
    args: [playerAddress as `0x${string}`],
  });
  return result as boolean;
}

export async function getFreeSpinAvailable(
  publicClient: PublicClient,
  contractAddress: string,
  playerAddress: string
): Promise<boolean> {
  const result = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: EVEN_ODD_ABI,
    functionName: 'playerHasFreeSpin',
    args: [playerAddress as `0x${string}`],
  });
  return result as boolean;
}

export async function getTotalWinnings(
  publicClient: PublicClient,
  contractAddress: string,
  playerAddress: string
): Promise<bigint> {
  const result = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: EVEN_ODD_ABI,
    functionName: 'totalWinnings',
    args: [playerAddress as `0x${string}`],
  });
  return result as bigint;
}

export async function getBetAmount(
  publicClient: PublicClient,
  contractAddress: string
): Promise<bigint> {
  const result = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: EVEN_ODD_ABI,
    functionName: 'BET_AMOUNT',
    args: [],
  });
  return result as bigint;
}

export async function getPayoutAmount(
  publicClient: PublicClient,
  contractAddress: string
): Promise<bigint> {
  const result = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: EVEN_ODD_ABI,
    functionName: 'WIN_PAYOUT',
    args: [],
  });
  return result as bigint;
}

export async function getLastResult(
  publicClient: PublicClient,
  contractAddress: string,
  playerAddress: string
): Promise<string> {
  const result = await publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: EVEN_ODD_ABI,
    functionName: 'getLastResult',
    args: [playerAddress as `0x${string}`],
  });
  return result as string;
} 