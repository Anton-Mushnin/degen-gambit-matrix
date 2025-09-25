import React from 'react';
import { Terminal } from '../../../components/matrixUI/Terminal';
import RandomNumbers from './RandomNumbers';
import styles from './MatrixTerminal.module.css';

interface DegenGambitGameState {
  isProcessing: boolean;
  isSpinning: boolean;
  outcome: string[];
  terminalQueue: {
    length: number;
    shift: () => { text: string; toType: boolean } | undefined;
  };
}

interface DegenGambitGameActions {
  handleInput: (input: string) => Promise<void>;
  triggerWinEffect: (outcome?: any) => void;
}

type DegenGambitContext = [DegenGambitGameState, DegenGambitGameActions];

interface DegenGambitMainProps {
  useGameContext: () => DegenGambitContext;
}

const DegenGambitMain: React.FC<DegenGambitMainProps> = ({ useGameContext }) => {
  const [gameState, gameActions] = useGameContext();
  const { isProcessing, isSpinning, outcome, terminalQueue } = gameState;

  return (
    <div style={{ position: 'relative', width: '100%', maxHeight: '100%', height: '100%', paddingTop: '20px' }}>
      <Terminal
        queue={terminalQueue}
        onSubmit={gameActions.handleInput}
        isInputDisabled={isProcessing || isSpinning || outcome.length > 0}
      >
        {isSpinning && (
          <div className={styles.spinningContainer}>
            <RandomNumbers />
            <RandomNumbers />
            <RandomNumbers />
          </div>
        )}
        {outcome.length > 0 && (
          <div className={styles.spinningContainer}>
            {outcome.map((item: string, index: number) => (
              <RandomNumbers key={index} result={item} duration={2000 + index * 2000} />
            ))}
          </div>
        )}
      </Terminal>
    </div>
  );
};

export default DegenGambitMain;
