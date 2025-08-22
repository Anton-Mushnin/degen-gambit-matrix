import React, { createContext, useContext, ReactNode } from 'react';
import { useGame } from '../hooks/useGame';

// Create the context with the return type of useGame
type GameContextType = ReturnType<typeof useGame>;

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const gameState = useGame();

  return (
    <GameContext.Provider value={gameState}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

// Export the context for direct usage if needed
export { GameContext }; 