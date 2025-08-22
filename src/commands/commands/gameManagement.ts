import { CommandDefinition, CommandContext } from '../types';
import { gameRegistry } from '../../games/registry';

// Define the parameters for game management commands
export interface GameManagementParams {
  gameContext?: {
    activeGameId: string | null;
    switchGameByName: (gameName: string) => boolean;
    getGameNames: () => string[];
    getGameInfo: () => any;
    availableGames: any[];
  };
}

// List all available games
const listGamesHandler = async (context: CommandContext<GameManagementParams>) => {
  const games = gameRegistry.getAllGames();
  const activeGameId = context.params.gameContext?.activeGameId;
  
  if (games.length === 0) {
    return {
      output: ['No games available']
    };
  }

  const output = [
    'Available Games:',
    '',
    ...games.map(game => {
      const isActive = game.id === activeGameId;
      const marker = isActive ? '▶ ' : '  ';
      return `${marker}${game.name} (${game.id}) - ${game.description}`;
    }),
    '',
    'Usage:',
    '• Type game name to switch (e.g., "degen-gambit")',
    '• Use "games switch <name>" to switch games',
    '• Use "games info <name>" for detailed info'
  ];

  return { output };
};

// Switch to a specific game
const switchGameHandler = async (context: CommandContext<GameManagementParams>) => {
  const input = context.input.trim();
  const match = input.match(/^games?\s+switch\s+(.+)$/i) || input.match(/^([a-zA-Z0-9-]+)$/);
  
  if (!match) {
    return {
      output: [
        'Usage: games switch <gameName> or just <gameName>',
        'Example: games switch degen-gambit or degen-gambit'
      ]
    };
  }

  const gameName = match[1];
  const gameContext = context.params.gameContext;
  
  if (!gameContext) {
    return {
      output: ['Game context not available']
    };
  }

  const success = gameContext.switchGameByName(gameName);
  
  if (success) {
    const game = gameRegistry.getGameByName(gameName);
    return {
      output: [
        `Successfully switched to: ${game?.name || gameName}`,
        `Game ID: ${game?.id || gameName}`,
        game?.description ? `Description: ${game.description}` : '',
        '',
        'Type "help" to see available commands for this game'
      ].filter(Boolean)
    };
  } else {
    const availableGames = gameRegistry.getGameNames();
    return {
      output: [
        `Game '${gameName}' not found`,
        '',
        'Available games:',
        ...availableGames.map(name => `• ${name}`)
      ]
    };
  }
};

// Get detailed info about a game
const gameInfoHandler = async (context: CommandContext<GameManagementParams>) => {
  const match = context.input.match(/^games?\s+info\s+(.+)$/i);
  
  if (!match) {
    // Show info for current game if no game specified
    const gameContext = context.params.gameContext;
    const currentGameInfo = gameContext?.getGameInfo();
    
    if (!currentGameInfo) {
      return {
        output: [
          'No active game',
          'Usage: games info <gameName>'
        ]
      };
    }

    return {
      output: [
        `Current Game: ${currentGameInfo.name}`,
        `ID: ${currentGameInfo.id}`,
        `Description: ${currentGameInfo.description}`,
        `Version: ${currentGameInfo.version}`
      ]
    };
  }

  const gameName = match[1];
  const game = gameRegistry.getGameByName(gameName);
  
  if (!game) {
    return {
      output: [
        `Game '${gameName}' not found`,
        'Use "games list" to see available games'
      ]
    };
  }

  const commandCount = game.commands?.length || 0;
  const componentCount = Object.keys(game.components || {}).length;

  return {
    output: [
      `Game: ${game.name}`,
      `ID: ${game.id}`,
      `Description: ${game.description}`,
      `Version: ${game.version}`,
      `Commands: ${commandCount}`,
      `Components: ${componentCount}`,
      '',
      'To switch to this game, type:',
      `  ${game.id}`
    ]
  };
};

// Main game management handler that routes to specific handlers
const gameManagementHandler = async (context: CommandContext<GameManagementParams>) => {
  const input = context.input.trim();
  
  // Parse the command
  const listMatch = input.match(/^games?\s+(list|ls)$/i) || input.match(/^games?$/i);
  const switchMatch = input.match(/^games?\s+switch\s+(.+)$/i);
  const infoMatch = input.match(/^games?\s+info(?:\s+(.+))?$/i);
  
  if (listMatch) {
    return listGamesHandler(context);
  }
  
  if (switchMatch) {
    return switchGameHandler(context);
  }
  
  if (infoMatch) {
    return gameInfoHandler(context);
  }
  
  // Default to listing games if command not recognized
  return listGamesHandler(context);
};

// Command definitions
export const gameManagementCommands: CommandDefinition<GameManagementParams>[] = [
  {
    pattern: {
      pattern: /^games?\s+(list|ls|switch|info)(?:\s+(.+))?$/i,
      name: 'games',
      description: 'Manage games - list, switch, or get info',
      usage: 'games [list|switch|info] [gameName]',
    },
    handler: gameManagementHandler,
  },
  {
    pattern: {
      pattern: /^games?$/i,
      name: 'games-list',
      description: 'List available games',
      usage: 'games',
    },
    handler: listGamesHandler,
  },
  {
    pattern: {
      pattern: /^help$/i,
      name: 'help',
      description: 'Show available commands',
      usage: 'help',
    },
    handler: async (context: CommandContext<GameManagementParams>) => {
      const gameContext = context.params.gameContext;
      const currentGame = gameContext?.getGameInfo();
      
      const output = [
        'Available Commands:',
        '',
        'Global Commands:',
        '• games - List available games',
        '• games list - List available games',
        '• games switch <name> - Switch to a game',
        '• games info [name] - Get game information',
        '• help - Show this help',
        ''
      ];

      if (currentGame) {
        output.push(`Current Game: ${currentGame.name}`);
        output.push('Game-specific commands available (type invalid command to see them)');
      } else {
        output.push('No active game - switch to a game to see game-specific commands');
      }

      output.push('');
      output.push('Available Games:');
      const games = gameRegistry.getAllGames();
      output.push(...games.map(game => `• ${game.id} - Switch to ${game.name}`));

      return { output };
    },
  }
]; 