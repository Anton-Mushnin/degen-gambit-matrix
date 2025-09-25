import React from 'react';
import { Terminal } from './matrixUI/Terminal';

// Generic interfaces for game contexts
export interface GenericGameState {
  isProcessing: boolean;
  terminalQueue: {
    length: number;
    shift: () => { text: string; toType: boolean } | undefined;
  };
}

export interface GenericGameActions {
  handleInput: (input: string) => Promise<void>;
  triggerWinEffect?: (outcome?: any) => void;
}

export type GenericGameContext = [GenericGameState, GenericGameActions];

export interface GameMainProps {
  useGameContext: () => GenericGameContext;
}

const GameMain: React.FC<GameMainProps> = ({ useGameContext }) => {
  const [gameState, gameActions] = useGameContext();
  const { isProcessing, terminalQueue } = gameState;

  return (
    <div style={{ position: 'relative', width: '100%', maxHeight: '100%', height: '100%', paddingTop: '20px' }}>
      <Terminal
        queue={terminalQueue}
        onSubmit={gameActions.handleInput}
        isInputDisabled={isProcessing}
      />
    </div>
  );
};

export default GameMain;
