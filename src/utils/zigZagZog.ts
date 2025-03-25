import { zigZagZogABI } from '../ABIs/ZigZagZog.abi.ts';
import { createPublicClient, formatUnits, http, WalletClient } from 'viem';
import { g7Testnet, wagmiConfig } from '../config';
import { getPublicClient } from '@wagmi/core';
import { multicall } from '@wagmi/core';
import { ShapeSelection } from './signing.ts';


export const getZigZagZogConstants = async (contractAddress: string) => {

    const contract = {
        address: contractAddress,
        abi: zigZagZogABI,
      } as const

      const result = await multicall(wagmiConfig, {
        contracts: [
          {
            ...contract,
            functionName: 'playCost',
          },
          {
            ...contract,
            functionName: 'commitDuration',
          },
          {
            ...contract,
            functionName: 'revealDuration',
          },
          {
            ...contract,
            functionName: 'ZigZagZogVersion',
          },
        ],
      })
      return result
}


export const getZigZagZogInfo = async (contractAddress: string) => {

    const publicClient = getPublicClient(wagmiConfig);

    const contract = {
        address: contractAddress,
        abi: zigZagZogABI,
      } as const

      const gameNumber = await publicClient.readContract({
        ...contract,
        functionName: 'currentGameNumber',
      });      

      const result = await multicall(wagmiConfig, {
        contracts: [
          {
            ...contract,
            functionName: 'GameState',
            args: [gameNumber]
          },
          {
            ...contract,
            functionName: 'gameBalance',
            args: [gameNumber]
          },
          {
            ...contract,
            functionName: 'currentGameNumber',
          },
          {
            ...contract,
            functionName: 'survivingPlays',
            args: [gameNumber]
          },
          {
            ...contract,
            functionName: 'hasGameEnded',
            args: [gameNumber]
          },
        ],
      })
      return result
    }


   export const getPlayerState = async (contractAddress: string, playerAddress: string, gameNumber: bigint, roundNumber: bigint) => {

        const contract = {
            address: contractAddress,
            abi: zigZagZogABI,
        } as const

        const result = await multicall(wagmiConfig, {
            contracts: [
                {
                    ...contract,
                    functionName: 'playerHasCommitted',
                    args: [gameNumber, roundNumber, playerAddress]
                },
                {
                    ...contract,
                    functionName: 'playerHasRevealed',
                    args: [gameNumber, roundNumber, playerAddress]
                },
                {
                    ...contract,
                    functionName: 'playerSurvivingPlays',
                    args: [gameNumber, playerAddress]
                },
                {
                    ...contract,
                    functionName: 'playerCommitment',
                    args: [gameNumber, roundNumber, playerAddress]
                },
                {
                    ...contract,
                    functionName: 'purchasedPlays',
                    args: [gameNumber, playerAddress]
                },
            ]
        })
        return result
    }

    export interface PlayerState {
        hasCommitted: boolean;
        hasRevealed: boolean;
        survivingPlays: bigint;
        commitment: bigint;
        purchasedPlays: bigint;
    }

    export const parsePlayerState = (result: any[]): PlayerState => {
        const results = result.map((r) => r.result);
        const [hasCommitted, hasRevealed, survivingPlays, commitment, purchasedPlays] = results;
        return {hasCommitted, hasRevealed, survivingPlays, commitment, purchasedPlays}
    }


    // Helper function to get the current block number and calculate blocks remaining
// Contract constants - loaded once and cached
let CONTRACT_CONSTANTS: {       
  playCost: bigint | null;
  commitDuration: bigint | null;
  revealDuration: bigint | null;
  version: string | null;
} = {
  playCost: null,
  commitDuration: null,
  revealDuration: null,
  version: null
};


export const buyPlays = async (contractAddress: string, value: bigint, client: WalletClient, gameNumber: bigint) => {
  console.log("Buying plays", gameNumber, contractAddress, value);
    const account = client.account;
    if (!account) {
      throw new Error("No account provided");
    }

  
  
    const hash = await client.writeContract({
      account,
      address: contractAddress,
      value,
      abi: zigZagZogABI,
      functionName: 'buyPlays',
      args: [gameNumber],
      chain: g7Testnet,
    })
    return hash
}

interface GameInfo {
  gameTimestamp: number;
  roundNumber: bigint;
  roundTimestamp: number;
  gameBalance: bigint;
  currentGameNumber: bigint;
  survivingPlays: bigint;
  hasGameEnded: boolean;
}

export const parseZigZagZogInfo = (result: any[]): GameInfo => {
    const results = result.map((r) => r.result);
    const [gameState, gameBalance, currentGameNumber, survivingPlays, hasGameEnded] = results;

  return {
    gameTimestamp: Number(gameState[0]) * (1000),
    roundNumber: gameState[1],
    roundTimestamp: Number(gameState[2])  * (1000),
    gameBalance: gameBalance,
    currentGameNumber: currentGameNumber,
    survivingPlays: survivingPlays,
    hasGameEnded: hasGameEnded,
  };
};

export interface ContractConstants {
  playCost: bigint;
  commitDuration: number;
  revealDuration: number;
  version: string;
}

export const parseZigZagZogConstants = (result: any[]): ContractConstants => {
    const results = result.map((r) => r.result);
    const [playCost, commitDuration, revealDuration, version] = results;

  return {
    playCost,
    commitDuration: Number(commitDuration) * 1000,
    revealDuration: Number(revealDuration) * 1000,
    version,
  };
};

export interface Commitment {
  nonce: bigint;
  gameNumber: bigint;
  roundNumber: bigint;
  shapes: ShapeSelection;
}

export const revealChoices = async (contractAddress: string, client: WalletClient, commitment: Commitment) => {
    const account = client.account;
    if (!account) {
      throw new Error("No account provided");
    }
    const args: readonly [bigint, bigint, bigint, bigint, bigint, bigint] = [
        commitment.gameNumber,
        commitment.roundNumber,
        BigInt(commitment.nonce),
        commitment.shapes.circles,
        commitment.shapes.squares,
        commitment.shapes.triangles
    ];
    console.log("Revealing choices", args, contractAddress);



    const hash = await client.writeContract({
        account,
        address: contractAddress,
        abi: zigZagZogABI,
        functionName: 'revealChoices',
        args,
        chain: g7Testnet,
    })
    return hash
}
