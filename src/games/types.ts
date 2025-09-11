// Common game interfaces and types
import { CommandDefinition } from '../commands/types';
import { Chain } from 'viem';

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
    network: Chain;
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


export interface QueryDataItem {
    type: 'query';
    label: string;
    queryKey: string[];
    queryFn: () => Promise<{ formatted: string; value: bigint; decimals: number; } | null>;
    refetchInterval?: number;
    animation?: boolean;
    onDataUpdate?: (data: any) => void;
}

export interface StaticDataItem {
    type: 'static';
    label: string;
    data: {
        formatted: string;
        value: bigint;
        decimals: number;
    };
    animation?: boolean;
}

export type DataItem = QueryDataItem | StaticDataItem;
