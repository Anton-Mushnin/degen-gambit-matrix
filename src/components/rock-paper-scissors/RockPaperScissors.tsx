import { useEffect } from 'react';
import { useRockPaperScissorsGame } from '../../hooks/rock-paper-scissors/useRockPaperScissorsGame';
import Matrix from "../matrixUI/Matrix";
import { Terminal } from "../matrixUI/Terminal";
import styles from './RockPaperScissors.module.css';

const RockPaperScissors = () => {
    const [gameState, gameActions] = useRockPaperScissorsGame();
    const { 
        gameState: currentGameState,
        isProcessing,
        outcome,
        terminalQueue,
        playerRole,
        player1Move,
        player2Move,
        betAmount
    } = gameState;

    const showOutcome = outcome !== null;
    const isWaiting = currentGameState === 'waiting';
    const isCommitted = currentGameState === 'committed';
    const isRevealed = currentGameState === 'revealed';



    return (
        <div style={{ position: 'relative', width: '100%', maxHeight: '100%', height: '100%', paddingTop: '20px'}}>
            {showOutcome && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 10
                }}>
                    <Matrix 
                        outcome={outcome === 'player1' ? [1,1,1] : outcome === 'player2' ? [2,2,2] : [0,0,0]} 
                        onClose={() => gameActions.setOutcome(null)} 
                    />
                </div>
            )}
            <Terminal 
                queue={terminalQueue}
                onSubmit={gameActions.handleInput}
                isInputDisabled={isProcessing || isRevealed}
            >
                {isWaiting && (
                    <div className={styles.statusContainer}>
                        <p>Waiting for game to start...</p>
                        {betAmount && <p>Bet amount: {betAmount.toString()} wei</p>}
                    </div>
                )}
                {isCommitted && (
                    <div className={styles.statusContainer}>
                        <p>Your move is committed. Waiting for opponent...</p>
                        {playerRole && <p>You are playing as {playerRole}</p>}
                    </div>
                )}
                {isRevealed && (
                    <div className={styles.statusContainer}>
                        <p>Game revealed!</p>
                        <p>Player 1: {player1Move}</p>
                        <p>Player 2: {player2Move}</p>
                        {outcome && <p>Outcome: {outcome}</p>}
                    </div>
                )}
            </Terminal>
        </div>
    );
};

export default RockPaperScissors; 