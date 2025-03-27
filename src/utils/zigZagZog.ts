import { zigZagZogABI } from '../ABIs/ZigZagZog.abi.ts';
import { WalletClient } from 'viem';
import { g7Testnet, wagmiConfig } from '../config';
import { getPublicClient } from '@wagmi/core';
import { multicall } from '@wagmi/core';
import { ShapeSelection } from './signing.ts';



export interface GameConstants {
  playCost: bigint;
  commitDuration: number;
  revealDuration: number;
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
// let CONTRACT_CONSTANTS: {       
//   playCost: bigint | null;
//   commitDuration: bigint | null;
//   revealDuration: bigint | null;
//   version: string | null;
// } = {
//   playCost: null,
//   commitDuration: null,
//   revealDuration: null,
//   version: null
// };


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

export const claimWinning = async (contractAddress: string, gameNumber: bigint, client: WalletClient) => {
  const account = client.account;
    if (!account) {
      throw new Error("No account provided");
    }
    const hash = await client.writeContract({
      account,
      address: contractAddress,
      abi: zigZagZogABI,
      functionName: 'claimWinnings',
      args: [gameNumber],
      chain: g7Testnet,
    })
    return hash
}

export const playerRecentGames = async (contractAddress: string, playerAddress: string) => {
  const contract = {
    address: contractAddress,
    abi: zigZagZogABI,
  } as const

  const publicClient = getPublicClient(wagmiConfig);
  const currentGameNumber = await publicClient.readContract({
    ...contract,
    functionName: 'currentGameNumber',
  })
  let calls = []
  for (let i = currentGameNumber; i > 0 && i > Number(currentGameNumber) - 10; i--) {
    calls.push({
      ...contract,
      functionName: 'purchasedPlays',
      args: [i, playerAddress]
    })
  }
  const result = await multicall(wagmiConfig, {
    contracts: calls
  })
  const playedGames = result.map((r, idx) => ({gameNumber: calls[idx].args[0], plays: r.result})).filter((r) => Number(r.plays) > 0)
  let detailCalls = []
  for (let i = 0; i < playedGames.length; i++) {
    detailCalls.push({
      ...contract,
      functionName: 'playerSurvivingPlays',
      args: [playedGames[i].gameNumber, playerAddress]
    })
    detailCalls.push({
      ...contract,
      functionName: 'playerCashedOut',
      args: [playedGames[i].gameNumber, playerAddress]
    })
    detailCalls.push({
      ...contract,
      functionName: 'GameState',
      args: [playedGames[i].gameNumber]
    })
  }
  const detailResult = await multicall(wagmiConfig, {
    contracts: detailCalls
  })
  return playedGames.map((r, idx) => {
    const gameState = detailResult[idx * 3 + 2].result as unknown as {Array: bigint[]}
    return { ...r, 
      survivingPlays: detailResult[idx * 3].result, 
      cashedOut: detailResult[idx * 3 + 1].result, 
      roundNumber: gameState ? Number(gameState.Array[1]) : 0
    }
  })  
}


export const getRounds = async (contractAddress: string, gameNumber: string, lastRoundNumber: bigint, playerAddress: string) => {
  const contract = {
    address: contractAddress,
    abi: zigZagZogABI,
  } as const
  // const publicClient = getPublicClient(wagmiConfig);
  const calls = []
  for (let i = lastRoundNumber; i > 0; i--) {
    calls.push({
      ...contract,
      functionName: 'playerHasCommitted',
      args: [gameNumber, i, playerAddress]
    })
    calls.push({
      ...contract,
      functionName: 'playerHasRevealed',
      args: [gameNumber, i, playerAddress]
    })
    calls.push({
      ...contract,
      functionName: 'playerCirclesRevealed',
      args: [gameNumber, i, playerAddress]
    })
    calls.push({
      ...contract,
      functionName: 'playerSquaresRevealed',
      args: [gameNumber, i, playerAddress]
    })
    calls.push({
      ...contract,
      functionName: 'playerTrianglesRevealed',
      args: [gameNumber, i, playerAddress]
    })
    calls.push({
      ...contract,
      functionName: 'circlesRevealed',
      args: [gameNumber, i]
    })
    calls.push({
      ...contract,
      functionName: 'squaresRevealed',
      args: [gameNumber, i]
    })
    calls.push({
      ...contract,
      functionName: 'trianglesRevealed',
      args: [gameNumber, i]
    })
    
    
  }
  const result = await multicall(wagmiConfig, {
    contracts: calls
  })
  console.log(result)
  return result
}
