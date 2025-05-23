import { useDegenGambitGame } from '../hooks/useDegenGambitGame';
import Matrix from "./Matrix";          
import { Terminal } from "./matrix-ui/Terminal";
import RandomNumbers from "./RandomNumbers";
import styles from './MatrixTerminal.module.css';

const DegenGambit = () => {
    const [gameState, gameActions] = useDegenGambitGame();
    const { isWin, isSpinning, isProcessing, outcome, terminalQueue } = gameState;
    
    return (
        <div style={{ position: 'relative', width: '100%', maxHeight: '100%', height: '100%', paddingTop: '20px'}}>
            {isWin && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 10
                }}>
                    <Matrix outcome={[1,1,1]} onClose={() => gameActions.setIsWin(false)} />
                </div>
            )}
            <Terminal queue={terminalQueue}
                    onSubmit={gameActions.handleInput} 
                    isInputDisabled={isProcessing || isSpinning || outcome.length > 0}>
                {isSpinning && (
                    <div className={styles.spinningContainer}>
                        <RandomNumbers />
                        <RandomNumbers />
                        <RandomNumbers />
                    </div>
                )}
                {outcome.length > 0 && (
                    <div className={styles.spinningContainer}>
                        {outcome.map((item, index) => (
                            <RandomNumbers key={index} result={item} duration={2000 + index * 2000} />
                        ))}
                    </div>
                )}
            </Terminal>
        </div>
    );
};

export default DegenGambit;