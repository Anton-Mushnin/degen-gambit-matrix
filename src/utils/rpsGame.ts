import { contractAddress, viemG7Testnet, wagmiConfig } from '../config'
import { getPublicClient } from '@wagmi/core'
import { multicall } from '@wagmi/core';
import { createPublicClient, formatUnits, http, WalletClient, Abi } from 'viem';
import { waitForReceipt } from 'thirdweb/transaction';
import { sendTransaction, prepareContractCall } from 'thirdweb/transaction';
import { Account } from 'thirdweb/wallets';
import { ThirdwebClient } from 'thirdweb';
import { viemAdapter } from 'thirdweb/adapters/viem';

// Game moves enum
export enum Move {
  None = 0,
  Rock = 1,
  Paper = 2,
  Scissors = 3
}

// Game states enum
export enum GameState {
  WaitingForPlayer2 = 0,
  WaitingForPlayer1Move = 1,
  WaitingForPlayer2Move = 2,
  Committed = 3,
  Revealed = 4,
  Finished = 5,
  Cancelled = 6,
  Player1Timeout = 7
}

// Game info interface
export interface GameInfo {
  player1: string;
  player2: string;
  player1Move: Move;
  player2Move: Move;
  betAmount: bigint;
  timeout: bigint;
  createdAt: bigint;
  state: GameState;
  player1Revealed: boolean;
  player1MadeMove: boolean;
  player2MadeMove: boolean;
}

// Contract ABI - minimal version with only the functions we need
const RPS_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "timeout", "type": "uint256" }
    ],
    "name": "createGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" }
    ],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "internalType": "bytes32", "name": "commit", "type": "bytes32" }
    ],
    "name": "player1MakeMove",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "internalType": "uint8", "name": "move", "type": "uint8" }
    ],
    "name": "player2MakeMove",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "internalType": "uint8", "name": "move", "type": "uint8" },
      { "internalType": "bytes32", "name": "salt", "type": "bytes32" }
    ],
    "name": "revealMove",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" }
    ],
    "name": "claimTimeoutWin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" }
    ],
    "name": "getGame",
    "outputs": [
      { "internalType": "address", "name": "player1", "type": "address" },
      { "internalType": "address", "name": "player2", "type": "address" },
      { "internalType": "uint8", "name": "player1Move", "type": "uint8" },
      { "internalType": "uint8", "name": "player2Move", "type": "uint8" },
      { "internalType": "uint256", "name": "betAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "timeout", "type": "uint256" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
      { "internalType": "uint8", "name": "state", "type": "uint8" },
      { "internalType": "bool", "name": "player1Revealed", "type": "bool" },
      { "internalType": "bool", "name": "player1MadeMove", "type": "bool" },
      { "internalType": "bool", "name": "player2MadeMove", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MINIMUM_BET",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_TIMEOUT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "gameId", "type": "uint256" }
    ],
    "name": "withdrawAfterTimeout",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "activeGames",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Helper function to get contract instance
const getContract = (contractAddress: string) => ({
  address: contractAddress,
  abi: RPS_ABI,
} as const);

// Get game information
export const getGame = async (contractAddress: string, gameId: number): Promise<GameInfo | null> => {
  try {
    const publicClient = getPublicClient(wagmiConfig);
    const contract = getContract(contractAddress);
    
    const gameInfo = await publicClient.readContract({
      ...contract,
      functionName: 'getGame',
      args: [BigInt(gameId)],
    }) as [string, string, number, number, bigint, bigint, bigint, number, boolean, boolean, boolean];

    return {
      player1: gameInfo[0],
      player2: gameInfo[1],
      player1Move: gameInfo[2] as Move,
      player2Move: gameInfo[3] as Move,
      betAmount: gameInfo[4],
      timeout: gameInfo[5],
      createdAt: gameInfo[6],
      state: gameInfo[7] as GameState,
      player1Revealed: gameInfo[8],
      player1MadeMove: gameInfo[9],
      player2MadeMove: gameInfo[10],
    };
  } catch (error) {
    console.error("Error getting game info:", error);
    return null;
  }
};

// Create a new game
export const createGame = async (
  contractAddress: string,
  timeout: number,
  betAmount: bigint,
  client: WalletClient | ThirdwebClient,
  account: Account | undefined
) => {
  const viemContract = {
    address: contractAddress as `0x${string}`,
    abi: RPS_ABI,
  } as const;

  let hash: string | null = null;
  let receipt: any;
  try {
    if ('writeContract' in client) {
      const _account = client.account;
      if (!_account) throw new Error("No account provided");

      hash = await client.writeContract({
        account: _account,
        address: contractAddress as `0x${string}`,
        value: betAmount,
        abi: RPS_ABI,
        functionName: 'createGame',
        args: [BigInt(timeout)],
        chain: viemG7Testnet,
      });
    } else if (account) {
      const contract = viemAdapter.contract.fromViem({
        viemContract,
        chain: {
          ...viemG7Testnet,
          rpc: viemG7Testnet.rpcUrls["default"].http[0],
          blockExplorers: [{
            name: "Game7",
            url: viemG7Testnet.blockExplorers.default.url
          }],
          testnet: true
        },
        client,
      });

      const tx = prepareContractCall({
        contract,
        method: "createGame",
        params: [BigInt(timeout)],
        value: betAmount,
      });

      const transactionResult = await sendTransaction({
        transaction: tx,
        account,
      });

      receipt = await waitForReceipt(transactionResult);
      hash = receipt.transactionHash;
    }

    return {
      success: true,
      transactionHash: hash,
      description: "Game created successfully",
      receipt: receipt,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      description: "Failed to create game: " + errorMsg,
      error: errorMsg,
    };
  }
};

// Join an existing game
export const joinGame = async (
  contractAddress: string,
  gameId: number,
  client: WalletClient | ThirdwebClient,
  account: Account | undefined
) => {
  const viemContract = {
    address: contractAddress as `0x${string}`,
    abi: RPS_ABI,
  } as const;

  let hash: string | null = null;

  try {
    // Get game info to know the bet amount
    const gameInfo = await getGame(contractAddress, gameId);
    if (!gameInfo) throw new Error("Game not found");
    if (gameInfo.state !== GameState.WaitingForPlayer2) throw new Error("Game is not waiting for player 2");
    console.log('client', client);
    if ('writeContract' in client) {
      const _account = client.account;
      if (!_account) throw new Error("No account provided");

      hash = await client.writeContract({
        account: _account,
        address: contractAddress as `0x${string}`,
        value: gameInfo.betAmount,
        abi: RPS_ABI,
        functionName: 'joinGame',
        args: [BigInt(gameId)],
        chain: viemG7Testnet,
      });
    } else if (account) {
      const contract = viemAdapter.contract.fromViem({
        viemContract,
        chain: {
          ...viemG7Testnet,
          rpc: viemG7Testnet.rpcUrls["default"].http[0],
          blockExplorers: [{
            name: "Game7",
            url: viemG7Testnet.blockExplorers.default.url
          }],
          testnet: true
        },
        client,
      });

      const tx = prepareContractCall({
        contract,
        method: "joinGame",
        params: [BigInt(gameId)],
        value: gameInfo.betAmount,
      });

      const transactionResult = await sendTransaction({
        transaction: tx,
        account,
      });

      const receipt = await waitForReceipt(transactionResult);
      hash = receipt.transactionHash;
    }

    return {
      success: true,
      transactionHash: hash,
      description: "Successfully joined the game",
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      description: "Failed to join game: " + errorMsg,
      error: errorMsg,
    };
  }
};

// Make move as player 1 (with commit)
export const player1MakeMove = async (
  contractAddress: string,
  gameId: number,
  commit: string,
  client: WalletClient | ThirdwebClient,
  account: Account | undefined
) => {
  const viemContract = {
    address: contractAddress as `0x${string}`,
    abi: RPS_ABI,
  } as const;

  let hash: string | null = null;

  try {
    if ('writeContract' in client) {
      const _account = client.account;
      if (!_account) throw new Error("No account provided");

      hash = await client.writeContract({
        account: _account,
        address: contractAddress as `0x${string}`,
        abi: RPS_ABI,
        functionName: 'player1MakeMove',
        args: [BigInt(gameId), commit as `0x${string}`],
        chain: viemG7Testnet,
      });
    } else if (account) {
      const contract = viemAdapter.contract.fromViem({
        viemContract,
        chain: {
          ...viemG7Testnet,
          rpc: viemG7Testnet.rpcUrls["default"].http[0],
          blockExplorers: [{
            name: "Game7",
            url: viemG7Testnet.blockExplorers.default.url
          }],
          testnet: true
        },
        client,
      });

      const tx = prepareContractCall({
        contract,
        method: "player1MakeMove",
        params: [BigInt(gameId), commit as `0x${string}`],
      });

      const transactionResult = await sendTransaction({
        transaction: tx,
        account,
      });

      const receipt = await waitForReceipt(transactionResult);
      hash = receipt.transactionHash;
    }

    return {
      success: true,
      transactionHash: hash,
      description: "Move committed successfully",
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      description: "Failed to make move: " + errorMsg,
      error: errorMsg,
    };
  }
};

// Make move as player 2
export const player2MakeMove = async (
  contractAddress: string,
  gameId: number,
  move: Move,
  client: WalletClient | ThirdwebClient,
  account: Account | undefined
) => {
  const viemContract = {
    address: contractAddress as `0x${string}`,
    abi: RPS_ABI,
  } as const;

  let hash: string | null = null;

  try {
    if ('writeContract' in client) {
      const _account = client.account;
      if (!_account) throw new Error("No account provided");

      hash = await client.writeContract({
        account: _account,
        address: contractAddress as `0x${string}`,
        abi: RPS_ABI,
        functionName: 'player2MakeMove',
        args: [BigInt(gameId), move],
        chain: viemG7Testnet,
      });
    } else if (account) {
      const contract = viemAdapter.contract.fromViem({
        viemContract,
        chain: {
          ...viemG7Testnet,
          rpc: viemG7Testnet.rpcUrls["default"].http[0],
          blockExplorers: [{
            name: "Game7",
            url: viemG7Testnet.blockExplorers.default.url
          }],
          testnet: true
        },
        client,
      });

      const tx = prepareContractCall({
        contract,
        method: "player2MakeMove",
        params: [BigInt(gameId), move],
      });

      const transactionResult = await sendTransaction({
        transaction: tx,
        account,
      });

      const receipt = await waitForReceipt(transactionResult);
      hash = receipt.transactionHash;
    }

    return {
      success: true,
      transactionHash: hash,
      description: "Move made successfully",
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      description: "Failed to make move: " + errorMsg,
      error: errorMsg,
    };
  }
};

// Reveal player 1's move
export const revealMove = async (
  contractAddress: string,
  gameId: number,
  move: Move,
  salt: string,
  client: WalletClient | ThirdwebClient,
  account: Account | undefined
) => {
  const viemContract = {
    address: contractAddress as `0x${string}`,
    abi: RPS_ABI,
  } as const;

  let hash: string | null = null;


  console.log('args', [BigInt(gameId), move, salt as `0x${string}`]);

  try {
    if ('writeContract' in client) {
      const _account = client.account;
      if (!_account) throw new Error("No account provided");

      hash = await client.writeContract({
        account: _account,
        address: contractAddress as `0x${string}`,
        abi: RPS_ABI,
        functionName: 'revealMove',
        args: [BigInt(gameId), move, salt as `0x${string}`],
        chain: viemG7Testnet,
      });
    } else if (account) {
      const contract = viemAdapter.contract.fromViem({
        viemContract,
        chain: {
          ...viemG7Testnet,
          rpc: viemG7Testnet.rpcUrls["default"].http[0],
          blockExplorers: [{
            name: "Game7",
            url: viemG7Testnet.blockExplorers.default.url
          }],
          testnet: true
        },
        client,
      });

      const tx = prepareContractCall({
        contract,
        method: "revealMove",
        params: [BigInt(gameId), move, salt as `0x${string}`],
      });

      const transactionResult = await sendTransaction({
        transaction: tx,
        account,
      });

      const receipt = await waitForReceipt(transactionResult);
      hash = receipt.transactionHash;
    }

    return {
      success: true,
      transactionHash: hash,
      description: "Move revealed successfully",
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      description: "Failed to reveal move: " + errorMsg,
      error: errorMsg,
    };
  }
};

// Claim timeout win
export const claimTimeoutWin = async (
  contractAddress: string,
  gameId: number,
  client: WalletClient | ThirdwebClient,
  account: Account | undefined
) => {
  const viemContract = {
    address: contractAddress as `0x${string}`,
    abi: RPS_ABI,
  } as const;

  let hash: string | null = null;

  try {
    if ('writeContract' in client) {
      const _account = client.account;
      if (!_account) throw new Error("No account provided");

      hash = await client.writeContract({
        account: _account,
        address: contractAddress as `0x${string}`,
        abi: RPS_ABI,
        functionName: 'claimTimeoutWin',
        args: [BigInt(gameId)],
        chain: viemG7Testnet,
      });
    } else if (account) {
      const contract = viemAdapter.contract.fromViem({
        viemContract,
        chain: {
          ...viemG7Testnet,
          rpc: viemG7Testnet.rpcUrls["default"].http[0],
          blockExplorers: [{
            name: "Game7",
            url: viemG7Testnet.blockExplorers.default.url
          }],
          testnet: true
        },
        client,
      });

      const tx = prepareContractCall({
        contract,
        method: "claimTimeoutWin",
        params: [BigInt(gameId)],
      });

      const transactionResult = await sendTransaction({
        transaction: tx,
        account,
      });

      const receipt = await waitForReceipt(transactionResult);
      hash = receipt.transactionHash;
    }

    return {
      success: true,
      transactionHash: hash,
      description: "Timeout win claimed successfully",
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      description: "Failed to claim timeout win: " + errorMsg,
      error: errorMsg,
    };
  }
};

// Get contract constants
export const getContractConstants = async (contractAddress: string) => {
  try {
    const publicClient = getPublicClient(wagmiConfig);
    const contract = getContract(contractAddress);
    
    const [minimumBet, defaultTimeout] = await multicall(wagmiConfig, {
      contracts: [
        {
          ...contract,
          functionName: 'MINIMUM_BET',
        },
        {
          ...contract,
          functionName: 'DEFAULT_TIMEOUT',
        },
      ],
    });
    console.log('minimumBet', minimumBet);
    console.log('defaultTimeout', defaultTimeout);

    return {
      minimumBet: minimumBet.result as bigint,
      defaultTimeout: defaultTimeout.result as bigint,
    };
  } catch (error) {
    console.error("Error getting contract constants:", error);
    return null;
  }
};

// Helper function to generate commit hash
export const generateCommit = async (move: Move, salt: string): Promise<string> => {
  // Convert salt to bytes32 if it's not already
  const saltBytes = salt.startsWith('0x') ? salt : `0x${salt}`;
  
  // Use ethers.js to match the contract's keccak256 and abi.encodePacked
  const { keccak256, solidityPacked } = await import('ethers');
  
  // Use solidityPacked to match abi.encodePacked
  const encoded = solidityPacked(['uint8', 'bytes32'], [move, saltBytes]);
  const commit = keccak256(encoded);
  
  return commit;
};

// Helper function to generate random salt
export const generateSalt = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Helper function to determine winner
export const determineWinner = (player1Move: Move, player2Move: Move): 'player1' | 'player2' | 'draw' => {
  if (player1Move === player2Move) return 'draw';
  
  if (
    (player1Move === Move.Rock && player2Move === Move.Scissors) ||
    (player1Move === Move.Scissors && player2Move === Move.Paper) ||
    (player1Move === Move.Paper && player2Move === Move.Rock)
  ) {
    return 'player1';
  }
  
  return 'player2';
};

export async function withdrawAfterTimeout(
    contractAddress: string,
    gameId: number,
    client: WalletClient | ThirdwebClient,
    account: Account
): Promise<{ success: boolean; description: string; transactionHash?: string }> {
    const viemContract = {
        address: contractAddress as `0x${string}`,
        abi: RPS_ABI,
    } as const;

    let hash: string | null = null;

    try {
        if ('writeContract' in client) {
            const _account = client.account;
            if (!_account) throw new Error("No account provided");

            hash = await client.writeContract({
                account: _account,
                address: contractAddress as `0x${string}`,
                abi: RPS_ABI,
                functionName: 'withdrawAfterTimeout',
                args: [BigInt(gameId)],
                chain: viemG7Testnet,
            });
        } else {
            const contract = viemAdapter.contract.fromViem({
                viemContract,
                chain: {
                    ...viemG7Testnet,
                    rpc: viemG7Testnet.rpcUrls["default"].http[0],
                    blockExplorers: [{
                        name: "Game7",
                        url: viemG7Testnet.blockExplorers.default.url
                    }],
                    testnet: true
                },
                client,
            });

            const tx = prepareContractCall({
                contract,
                method: "withdrawAfterTimeout",
                params: [BigInt(gameId)],
            });

            const transactionResult = await sendTransaction({
                transaction: tx,
                account,
            });

            const receipt = await waitForReceipt(transactionResult);
            hash = receipt.transactionHash;
        }

        return {
            success: true,
            description: "Withdrawal successful",
            transactionHash: hash
        };
    } catch (error: any) {
        return {
            success: false,
            description: error.message || "Failed to withdraw after timeout"
        };
    }
}

export async function getActiveGame(
    contractAddress: string,
    playerAddress: string
): Promise<{ success: boolean; gameId: number | null; description: string }> {
    try {
        const contract = getContract(contractAddress);
        const publicClient = createPublicClient({
            chain: viemG7Testnet,
            transport: http()
        });

        const gameId = await publicClient.readContract({
            ...contract,
            functionName: "activeGames",
            args: [playerAddress as `0x${string}`]
        });

        return {
            success: true,
            gameId: Number(gameId),
            description: Number(gameId) === 0 ? "No active game found" : `Active game ID: ${gameId}`
        };
    } catch (error: any) {
        return {
            success: false,
            gameId: null,
            description: error.message || "Failed to get active game"
        };
    }
} 