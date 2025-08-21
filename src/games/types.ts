// Common game interfaces and types
import { CommandDefinition } from '../commands/types';

// Base game interface that all games must implement
export interface Game {
    id: string;
    name: string;
    description: string;
    version: string;
    commands: CommandDefinition<unknown>[];
    components: {
        main: React.ComponentType<unknown>;
        rules?: React.ComponentType<unknown>;
        contractInfo?: React.ComponentType<unknown>;
        stream?: React.ComponentType<unknown>;
    };
    hooks: {
        [key: string]: (...args: unknown[]) => unknown;
    };
    config: {
        [key: string]: unknown;
    };
}

// Game state interface
export interface GameState {
    activeGame: Game | null;
    availableGames: Game[];
    gameHistory: string[]; // Track recently used games
}

// Game context interface for React context
export interface GameContextType {
    gameState: GameState;
    switchGame: (gameId: string) => void;
    getCurrentGame: () => Game | null;
    getAvailableGames: () => Game[];
}

// Game command result interface
export interface GameCommandResult {
    success: boolean;
    output: string[];
    data?: unknown;
    error?: string;
}

// Game initialization options
export interface GameInitOptions {
    config?: Record<string, unknown>;
    autoLoad?: boolean;
} 