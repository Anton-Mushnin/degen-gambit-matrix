import { useState, useCallback, useMemo } from 'react';
import { gameRegistry, GameState } from '../games';

export const useGame = () => {
  const [activeGameId, setActiveGameId] = useState<string>(() => {
    // Initialize with the first available game or default game
    const defaultGame = gameRegistry.getDefaultGame();
    return defaultGame?.id || gameRegistry.getAllGames()[0]?.id || '';
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    return gameRegistry.getInitialState();
  });

  // Get the currently active game
  const activeGame = useMemo(() => {
    return gameRegistry.getGame(activeGameId);
  }, [activeGameId]);

  // Get all available games
  const availableGames = useMemo(() => {
    return gameRegistry.getAllGames();
  }, []);

  // Switch to a different game
  const switchGame = useCallback((gameId: string) => {
    if (gameRegistry.hasGame(gameId)) {
      setActiveGameId(gameId);
      // Reset game state when switching games
      setGameState(gameRegistry.getInitialState());
      console.log(`Switched to game: ${gameId}`);
    } else {
      console.warn(`Game not found: ${gameId}`);
    }
  }, []);

  // Switch to a game by name (for terminal commands)
  const switchGameByName = useCallback((gameName: string) => {
    const game = gameRegistry.getGameByName(gameName);
    if (game) {
      switchGame(game.id);
      return true;
    }
    return false;
  }, [switchGame]);

  // Get game-specific commands
  const getGameCommands = useCallback(() => {
    return activeGame?.commands || [];
  }, [activeGame]);

  // Get game-specific components
  const getGameComponents = useCallback(() => {
    return activeGame?.components || {};
  }, [activeGame]);

  // Get game-specific hooks
  const getGameHooks = useCallback(() => {
    return activeGame?.hooks || {};
  }, [activeGame]);

  // Get game-specific config
  const getGameConfig = useCallback(() => {
    return activeGame?.config || {};
  }, [activeGame]);

  // Update game state
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset current game state
  const resetGameState = useCallback(() => {
    setGameState(gameRegistry.getInitialState());
  }, []);

  // Get game info for display
  const getGameInfo = useCallback(() => {
    if (!activeGame) return null;
    
    return {
      id: activeGame.id,
      name: activeGame.name,
      description: activeGame.description,
      version: activeGame.version,
    };
  }, [activeGame]);

  // Check if a specific game is active
  const isGameActive = useCallback((gameId: string) => {
    return activeGameId === gameId;
  }, [activeGameId]);

  // Get list of game names for terminal commands
  const getGameNames = useCallback(() => {
    return gameRegistry.getGameNames();
  }, []);

  return {
    // State
    activeGameId,
    activeGame,
    gameState,
    availableGames,
    
    // Actions
    switchGame,
    switchGameByName,
    updateGameState,
    resetGameState,
    
    // Getters
    getGameCommands,
    getGameComponents,
    getGameHooks,
    getGameConfig,
    getGameInfo,
    getGameNames,
    
    // Utilities
    isGameActive,
  };
}; 