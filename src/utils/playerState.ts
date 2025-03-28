import { zigZagZogABI } from '../ABIs/ZigZagZog.abi.ts';
import { wagmiConfig } from '../config';
import { multicall } from '@wagmi/core';
import { EliminationResult, GameAndRoundState, RoundRevealState } from './gameAndRoundState.ts';
import { calculateEliminationResult } from './gameAndRoundState.ts';
import { GameState } from './gameState.ts';

export const getRounds = async (contractAddress: string, gameNumber: string, lastRoundNumber: bigint, playerAddress: string) => {
    const contract = {
      address: contractAddress,
      abi: zigZagZogABI,
    } as const
    const calls = []
    for (let i = 1; i <= lastRoundNumber; i += 1) {
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
    return parseRoundResults(result.map((r) => r.result))
  }

export interface RoundState {
  roundNumber: number;
  playerCommitted: boolean;
  playerRevealed: boolean;
  playerShapes: {
    circles: number;
    squares: number;
    triangles: number;
  };
  totalShapes: {
    circles: number;
    squares: number;
    triangles: number;
  };
  eliminationResult: EliminationResult;
  survivingPlays: number;
}

export const parseRoundResults = (results: any[]): RoundState[] => {
  const rounds: RoundState[] = [];
  // Process results in groups of 8 (number of calls per round)
  for (let i = 0; i < results.length; i += 8) {
    const playerShapes = {
      circles: Number(results[i + 2]),
      squares: Number(results[i + 3]),
      triangles: Number(results[i + 4]),
    }
    const totalShapes = {
      circles: Number(results[i + 5]),
      squares: Number(results[i + 6]),
      triangles: Number(results[i + 7]),
    }
    const eliminationResult = calculateEliminationResult({
      circlesRevealed: Number(results[i + 5]),
      squaresRevealed: Number(results[i + 6]),
      trianglesRevealed: Number(results[i + 7]),
    })

    const survivingPlays = eliminationResult ===  EliminationResult.CircleEliminated ? 
      playerShapes.squares + playerShapes.triangles :
      eliminationResult === EliminationResult.SquareEliminated ?
        playerShapes.circles + playerShapes.triangles :
        eliminationResult === EliminationResult.TriangleEliminated ?
          playerShapes.circles + playerShapes.squares :
          playerShapes.circles + playerShapes.squares + playerShapes.triangles;

    const round: RoundState = {
      roundNumber: i / 8 + 1,
      playerCommitted: results[i],
      playerRevealed: results[i + 1],
      playerShapes,
      totalShapes,
      eliminationResult,
      survivingPlays
    };
    rounds.push(round);
  }
  
  return rounds;
}

export const getShareInfo = async (contractAddress: string, gameNumber: string, playerAddress: string) => {
    const contract = {
        address: contractAddress,
        abi: zigZagZogABI,
      } as const

      const result = await multicall(wagmiConfig, {
        contracts: [
          {
            ...contract,
            functionName: 'purchasedPlays',
            args: [BigInt(gameNumber), playerAddress]
          },
          {
            ...contract,
            functionName: 'gameBalance',
            args: [BigInt(gameNumber)]
          }
        ]
      })
      const [purchasedPlays, gameBalance] = result.map((r) => r.result)
      return {
        purchasedPlays: Number(purchasedPlays),
        gameBalance: Number(gameBalance),
      }
}


export const getRoundRevealState = async (contractAddress: string, gameNumber: string, roundNumber: number, playerAddress: string): Promise<RoundRevealState> => {
  const contract = {
    address: contractAddress,
    abi: zigZagZogABI,
  } as const

  const result = await multicall(wagmiConfig, {
    contracts: [
      {
        ...contract,
        functionName: 'circlesRevealed',
        args: [BigInt(gameNumber), BigInt(roundNumber)]
      },
      {
        ...contract,
        functionName: 'squaresRevealed',
        args: [BigInt(gameNumber), BigInt(roundNumber)]
      },    
      {
        ...contract,
        functionName: 'trianglesRevealed',
        args: [BigInt(gameNumber), BigInt(roundNumber)]
      },
      {
        ...contract,
        functionName: 'circlePlayerCount',
        args: [BigInt(gameNumber), BigInt(roundNumber)]
      },    
      {
        ...contract,
        functionName: 'squarePlayerCount',
        args: [BigInt(gameNumber), BigInt(roundNumber)]
      },
      {
        ...contract,
        functionName: 'trianglePlayerCount',
        args: [BigInt(gameNumber), BigInt(roundNumber)]
      },
      {
        ...contract,
        functionName: 'lastCircleRevealed',
        args: [BigInt(gameNumber), BigInt(roundNumber)]
      },
      {
        ...contract,
        functionName: 'lastSquareRevealed',
        args: [BigInt(gameNumber), BigInt(roundNumber)]
      },        
      {
        ...contract,
        functionName: 'lastTriangleRevealed',
        args: [BigInt(gameNumber), BigInt(roundNumber)]
      },
      {
        ...contract,
        functionName: 'playerCirclesRevealed',
        args: [BigInt(gameNumber), BigInt(roundNumber), playerAddress]
      },
      {
        ...contract,
        functionName: 'playerSquaresRevealed',
        args: [BigInt(gameNumber), BigInt(roundNumber), playerAddress]
      },
      {
        ...contract,
        functionName: 'playerTrianglesRevealed',
        args: [BigInt(gameNumber), BigInt(roundNumber), playerAddress]
      } 
    ]
  })
  const [circlesRevealed, squaresRevealed, trianglesRevealed, circlePlayerCount, squarePlayerCount, trianglePlayerCount, lastCircleRevealed, lastSquareRevealed, lastTriangleRevealed, playerCirclesRevealed, playerSquaresRevealed, playerTrianglesRevealed] = result.map((r) => r.result)  

  return {
    circlesRevealed: Number(circlesRevealed),
    squaresRevealed: Number(squaresRevealed),
    trianglesRevealed: Number(trianglesRevealed),
    circlePlayerCount: Number(circlePlayerCount),
    squarePlayerCount: Number(squarePlayerCount),
    trianglePlayerCount: Number(trianglePlayerCount),
    lastCircleRevealed: lastCircleRevealed ? lastCircleRevealed.toString() : '',
    lastSquareRevealed: lastSquareRevealed ? lastSquareRevealed.toString() : '',
    lastTriangleRevealed: lastTriangleRevealed ? lastTriangleRevealed.toString() : '',
    playerCirclesRevealed: Number(playerCirclesRevealed),
    playerSquaresRevealed: Number(playerSquaresRevealed),
    playerTrianglesRevealed: Number(playerTrianglesRevealed),
  }
  
}

export const canClaim = (rounds: RoundState[], gameState: GameState, gameAndRoundState: GameAndRoundState) => {
    console.log(gameAndRoundState.hasGameEnded, rounds[Number(gameState.roundNumber) - 1].playerRevealed, rounds[Number(gameState.roundNumber) - 1].survivingPlays > 0)
    return gameAndRoundState.hasGameEnded && rounds[Number(gameState.roundNumber) - 1].playerRevealed && rounds[Number(gameState.roundNumber) - 1].survivingPlays > 0
}
