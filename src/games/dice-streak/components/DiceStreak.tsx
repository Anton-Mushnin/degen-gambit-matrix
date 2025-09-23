import { useDiceStreakContext } from '../contexts/DiceStreakContext';
import Matrix from "../../../components/matrixUI/Matrix";
import { Terminal } from "../../../components/matrixUI/Terminal";

const DiceStreak = () => {
    const [gameState, gameActions] = useDiceStreakContext();
    const { isWin, isProcessing, terminalQueue } = gameState;

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
            <Terminal
                queue={terminalQueue}
                onSubmit={gameActions.handleInput}
                isInputDisabled={isProcessing}
            />
        </div>
    );
};

export default DiceStreak;
