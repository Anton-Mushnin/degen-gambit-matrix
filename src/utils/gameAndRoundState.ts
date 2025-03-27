import { GameConstants } from "./contractInfo";
import { GameState } from "./gameState";
import { getRoundRevealState } from "./playerState";

export interface GameAndRoundState {
    gameNumber: string;
    hasGameEnded: boolean;
    canBuyPlays: boolean;
    activeRound: number;
    timeLeft: number;
    isCommitPhase: boolean;
    isRevealPhase: boolean;
}





export enum EliminationResult {
    CircleEliminated = "CircleEliminated",
    SquareEliminated = "SquareEliminated",
    TriangleEliminated = "TriangleEliminated",
    NothingEliminated = "NothingEliminated"
}

export const calculateEliminationResult = ({
    circlesRevealed,
    squaresRevealed,
    trianglesRevealed
}: {
    circlesRevealed: number,
    squaresRevealed: number,
    trianglesRevealed: number
}): EliminationResult => {
    // Trump order is Circle > Square > Triangle
    if (circlesRevealed > squaresRevealed) {
        if (circlesRevealed >= trianglesRevealed) {
            return EliminationResult.CircleEliminated;
        } else {
            return EliminationResult.TriangleEliminated;
        }
    } else if (circlesRevealed === squaresRevealed) {
        if (circlesRevealed < trianglesRevealed) {
            return EliminationResult.TriangleEliminated;
        } else if (circlesRevealed === trianglesRevealed) {
            return EliminationResult.NothingEliminated;
        } else {
            return EliminationResult.CircleEliminated;
        }
    } else {
        if (squaresRevealed >= trianglesRevealed) {
            return EliminationResult.SquareEliminated;
        } else {
            return EliminationResult.TriangleEliminated;
        }
    }
}

  
    export interface RoundRevealState {
        circlesRevealed: number;
        squaresRevealed: number;
        trianglesRevealed: number;
        circlePlayerCount: number;
        squarePlayerCount: number;
        trianglePlayerCount: number;
        lastCircleRevealed: string;
        lastSquareRevealed: string;
        lastTriangleRevealed: string;
        playerCirclesRevealed: number;
        playerSquaresRevealed: number;
        playerTrianglesRevealed: number;
  }
  
  export const willGameEnd = (
    roundState: RoundRevealState
  ): boolean => {
    const circles = roundState.circlesRevealed;
    const squares = roundState.squaresRevealed;
    const triangles = roundState.trianglesRevealed;
  
    if (circles + squares + triangles === 0) {
      return true;
    }
  
    const elimResult = calculateEliminationResult({circlesRevealed: circles, squaresRevealed: squares, trianglesRevealed: triangles});
    console.log('elimResult', elimResult)
  
    if (elimResult === EliminationResult.NothingEliminated) {
      return true;
    }

    let playerSurvivingPlays = 0;
    let totalSurvivingPlays = 0;
    if (elimResult === EliminationResult.CircleEliminated) {
      playerSurvivingPlays = roundState.playerSquaresRevealed + roundState.playerTrianglesRevealed;
      totalSurvivingPlays = roundState.squaresRevealed + roundState.trianglesRevealed;
    } else if (elimResult === EliminationResult.SquareEliminated) {
      playerSurvivingPlays = roundState.playerCirclesRevealed + roundState.playerTrianglesRevealed;
      totalSurvivingPlays = roundState.circlesRevealed + roundState.trianglesRevealed;
    } else if (elimResult === EliminationResult.TriangleEliminated) {
      playerSurvivingPlays = roundState.playerCirclesRevealed + roundState.playerSquaresRevealed;
      totalSurvivingPlays = roundState.circlesRevealed + roundState.squaresRevealed;
    }

    if (totalSurvivingPlays <= 2) {
      return true;
    }

    if (playerSurvivingPlays === totalSurvivingPlays) {
      return true;
    }
  
    let rawCountRemaining = 0;

    
    if (elimResult === EliminationResult.CircleEliminated) {
      rawCountRemaining = 
        roundState.squarePlayerCount +
        roundState.trianglePlayerCount;
      
      if (rawCountRemaining === 1) {
        return true;
      } else if (rawCountRemaining === 2) {
        return roundState.lastSquareRevealed ===
               roundState.lastTriangleRevealed;
      }
    } else if (elimResult === EliminationResult.SquareEliminated) {
      rawCountRemaining = 
        roundState.circlePlayerCount +
        roundState.trianglePlayerCount;
      
      if (rawCountRemaining === 1) {
        return true;
      } else if (rawCountRemaining === 2) {
        return roundState.lastCircleRevealed ===
               roundState.lastTriangleRevealed;
      }
    } else if (elimResult === EliminationResult.TriangleEliminated) {
      rawCountRemaining = 
        roundState.circlePlayerCount +
        roundState.squarePlayerCount;
      console.log('rawCountRemaining', rawCountRemaining)
      if (rawCountRemaining === 1) {
        return true;
      } else if (rawCountRemaining === 2) {
        console.log('lastCircleRevealed', roundState.lastCircleRevealed)
        console.log('lastSquareRevealed', roundState.lastSquareRevealed)
        return roundState.lastCircleRevealed ===
               roundState.lastSquareRevealed;
      }
    }
  
    return false;
  }

  export const _hasGameEnded = async (contractAddress: string, gameState: GameState, playerAddress: string): Promise<boolean> => {
    const roundRevealState = await getRoundRevealState(contractAddress, gameState.gameNumber, Number(gameState.roundNumber), playerAddress);
    console.log('roundRevealState', roundRevealState)
    return willGameEnd(roundRevealState);
  }

  export const getGameAndRoundState = async (contractAddress: string, gameState: GameState, gameConstants: GameConstants, playerAddress: string): Promise<GameAndRoundState> => {
    const gameNumber = gameState.gameNumber;
    // let hasGameEnded = gameState.hasGameEnded;
    let hasGameEnded = await _hasGameEnded(contractAddress, gameState, playerAddress);
    console.log('hasGameEnded', hasGameEnded)

    const now = Date.now();
    if(now < gameState.roundTimestamp + gameConstants.commitDuration + gameConstants.revealDuration) {
        hasGameEnded = false;
    }
    
    
    let activeRound = Number(gameState.roundNumber);
    if (now > gameState.roundTimestamp + gameConstants.commitDuration + gameConstants.revealDuration) {
        activeRound = activeRound + 1;
    }
    const hasActiveRoundStarted = activeRound === Number(gameState.roundNumber);

    
    const { roundTimestamp } = gameState;
    let isCommitPhase = !hasActiveRoundStarted && !hasGameEnded;
    let isRevealPhase = false;
    let canBuyPlays = hasGameEnded;
    let timeLeft = 0;
    if (!hasGameEnded && hasActiveRoundStarted) {
        if (now < roundTimestamp + gameConstants.commitDuration) {
            isCommitPhase = true;
            timeLeft = roundTimestamp + gameConstants.commitDuration - now;
        }
        if (!isCommitPhase && now < roundTimestamp + gameConstants.commitDuration + gameConstants.revealDuration) {
            isRevealPhase = true;
            timeLeft = roundTimestamp + gameConstants.commitDuration + gameConstants.revealDuration - now;
        }
        canBuyPlays = Number(gameState.roundNumber) === 1 && isCommitPhase;
    }
    return { gameNumber, hasGameEnded, canBuyPlays, activeRound, timeLeft, isCommitPhase, isRevealPhase };
}
  
