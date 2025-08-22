import { CommandDefinition, CommandContext } from '../types';

export interface GameManagementParams {
  gameName?: string;
  action?: 'list' | 'switch' | 'info';
}

export interface GameManagementResult {
  games?: string[];
  currentGame?: string;
  switched?: boolean;
  message: string;
}

// This will be injected by the terminal when the command is executed
export interface GameManagementContext extends CommandContext<GameManagementParams> {
  gameManager?: {
    getGameNames: () => string[];
    switchGameByName: (name: string) => boolean;
    getGameInfo: () => { id: string; name: string; description: string; version: string } | null;
  };
}

// List all available games
const listGamesHandler = async (context: GameManagementContext) => {
  const { gameManager } = context;
  
  if (!gameManager) {
    return {
      output: ['Game manager not available'],
      data: {
        message: 'Game manager not available',
      },
    };
  }

  const gameNames = gameManager.getGameNames();
  const message = `Available games: ${gameNames.join(', ')}`;
  
  return {
    output: [message],
    data: {
      games: gameNames,
      message,
    },
  };
};

// Switch to a specific game
const switchGameHandler = async (context: GameManagementContext) => {
  const { gameManager, params } = context;
  
  if (!gameManager) {
    return {
      output: ['Game manager not available'],
      data: {
        message: 'Game manager not available',
      },
    };
  }

  const { gameName } = params;
  
  if (!gameName) {
    return {
      output: ['Please specify a game name to switch to'],
      data: {
        message: 'Please specify a game name to switch to',
      },
    };
  }

  const switched = gameManager.switchGameByName(gameName);
  
  if (switched) {
    const gameInfo = gameManager.getGameInfo();
    const message = `Switched to ${gameInfo?.name || gameName}`;
    return {
      output: [message],
      data: {
        switched: true,
        currentGame: gameInfo?.name || gameName,
        message,
      },
    };
  } else {
    const message = `Game '${gameName}' not found. Use 'games list' to see available games.`;
    return {
      output: [message],
      data: {
        switched: false,
        message,
      },
    };
  }
};

// Get current game info
const gameInfoHandler = async (context: GameManagementContext) => {
  const { gameManager } = context;
  
  if (!gameManager) {
    return {
      output: ['Game manager not available'],
      data: {
        message: 'Game manager not available',
      },
    };
  }

  const gameInfo = gameManager.getGameInfo();
  
  if (!gameInfo) {
    return {
      output: ['No active game'],
      data: {
        message: 'No active game',
      },
    };
  }

  const message = `Current game: ${gameInfo.name} (${gameInfo.description}) - v${gameInfo.version}`;
  return {
    output: [message],
    data: {
      currentGame: gameInfo.name,
      message,
    },
  };
};

// Main game management command handler
const gameManagementHandler = async (context: GameManagementContext) => {
  const { params } = context;
  const { action, gameName } = params;

  switch (action) {
    case 'list':
      return listGamesHandler(context);
    case 'switch':
      return switchGameHandler(context);
    case 'info':
      return gameInfoHandler(context);
    default:
      // If no action specified, try to switch to the game name directly
      if (gameName) {
        return switchGameHandler(context);
      }
      // Default to listing games
      return listGamesHandler(context);
  }
};

// Command definitions
export const gameManagementCommands: CommandDefinition<GameManagementParams>[] = [
  {
    pattern: {
      pattern: /^games?\s+(list|switch|info)(?:\s+(.+))?$/i,
      name: 'games',
      description: 'Manage games - list, switch, or get info',
      usage: 'games [list|switch|info] [gameName]',
    },
    handler: gameManagementHandler,
  },
  {
    pattern: {
      pattern: /^games?$/i,
      name: 'games',
      description: 'List available games',
      usage: 'games',
    },
    handler: listGamesHandler,
  },
  // Allow direct game name commands (e.g., "degen-gambit" to switch to that game)
  {
    pattern: {
      pattern: /^([a-zA-Z0-9-]+)$/,
      name: 'game-switch',
      description: 'Switch to a game by name',
      usage: '[gameName]',
    },
    handler: switchGameHandler,
  },
]; 