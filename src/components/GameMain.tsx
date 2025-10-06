import React from 'react';
import { Terminal } from './matrixUI/Terminal';
import { useTerminal } from '../hooks/useTerminal';

// Generic interfaces for game contexts
export interface GenericGameState {
  isBusy: boolean;
  terminalQueue: {
    length: number;
    shift: () => { text: string; toType: boolean } | undefined;
  };
  // Optional properties that games can use for display components
  isProcessing?: boolean;
  outcome?: any[];
  gameStatus?: any;
  gameParams?: any;
}

export interface GenericGameActions {
  handleInput: (input: string) => Promise<void>;
  triggerWinEffect?: (outcome?: any) => void;
}

export type GenericGameContext = [GenericGameState, GenericGameActions];

// Interface for components that can be displayed during different game states
export interface GameDisplayComponents {
  // Component to display when processing/spinning
  processingComponent?: React.ComponentType<any>;
  // Component to display when showing outcomes/results
  outcomeComponent?: React.ComponentType<any>;
  // Component to display during general game status
  statusComponent?: React.ComponentType<any>;
}

export interface GameMainProps {
  useGameContext: () => GenericGameContext;
  displayComponents?: GameDisplayComponents;
}

const GameMain: React.FC<GameMainProps> = ({ useGameContext, displayComponents }) => {
  const [gameState] = useGameContext();
  const { gameStatus, gameParams } = gameState;
  const { handleInput: terminalHandleInput, outputQueue: terminalQueue, isBusy, isProcessing, outcome } = useTerminal(gameParams);

  // Determine what component to render based on game state
  const renderDisplayComponent = () => {
    if (!displayComponents) return null;

    // Priority: outcome > processing > status
    if (outcome && outcome.length > 0 && displayComponents.outcomeComponent) {
      const OutcomeComponent = displayComponents.outcomeComponent;
      return <OutcomeComponent outcome={outcome} />;
    }

    if (isProcessing && displayComponents.processingComponent) {
      const ProcessingComponent = displayComponents.processingComponent;
      return <ProcessingComponent isProcessing={isProcessing} />;
    }

    if (gameStatus && displayComponents.statusComponent) {
      const StatusComponent = displayComponents.statusComponent;
      return <StatusComponent gameStatus={gameStatus} />;
    }

    return null;
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxHeight: '100%', height: '100%', paddingTop: '20px' }}>
      <Terminal
        queue={terminalQueue}
        onSubmit={terminalHandleInput}
        isInputDisabled={isBusy || Boolean(outcome && outcome.length > 0)}
      >
        {renderDisplayComponent()}
      </Terminal>
    </div>
  );
};

export default GameMain;
