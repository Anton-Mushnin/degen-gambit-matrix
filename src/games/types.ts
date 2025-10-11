// Common game interfaces and types
import React from 'react';
import { CommandDefinition } from '../commands/types';
import { Chain } from 'viem';
import { GenericGameContext, GameDisplayComponents } from '../components/GameMain';
import { EventConfig } from '../components/GameStream';

// Base game interface that all games must implement
export interface Game {
    id: string;
    name: string;
    description: string;
    version: string;
    commands: CommandDefinition<unknown>[];
    components: {
        main: GameMainConfig | React.ComponentType<unknown>;
        rules?: React.ComponentType<unknown>;
        contractInfo?: GameContractInfoConfig;
        contractConstants?: GameContractConstantsConfig;
        stream?: GameStreamConfig;
    };
    hooks: {
        [key: string]: (...args: unknown[]) => unknown;
    };
    context?: React.ComponentType<{ children: React.ReactNode }>;
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
    isTable?: boolean;
    headers?: string[];
    queryKey: string[];
    queryFn?: () => Promise<{ formatted: string; value: bigint; decimals: number; } | null>;
    tableQueryFn?: () => Promise<string[][]>;
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
    } | null;
    animation?: boolean;
}

export type DataItem = QueryDataItem | StaticDataItem;

// Component configuration interfaces
export interface GameMainConfig {
  useGameContext?: () => GenericGameContext;
  displayComponents?: GameDisplayComponents;
}

export interface GameContractInfoConfig {
  gameContractConfig?: import('../utils/gameConfig').GameContractConfig; // New dev mode aware config
  createDataItems: (params: {
    publicClient: any;
    activeAccount?: any;
    displayName?: string;
    queryClient?: any;
    privateKeyAddress?: string;
    contractAddress?: string; // Dev mode aware contract address
    contractABI?: any; // Dev mode aware contract ABI
  }) => { contractData: DataItem[]; playerData: DataItem[] };
}

export interface GameContractConstantsConfig {
  gameContractConfig?: import('../utils/gameConfig').GameContractConfig; // New dev mode aware config
  createContractConstantsData: (params: {
    publicClient: any;
    contractAddress?: string; // Dev mode aware contract address
    contractABI?: any; // Dev mode aware contract ABI
  }) => DataItem[];
}

export interface GameStreamConfig {
  gameContractConfig: import('../utils/gameConfig').GameContractConfig;
  eventConfigs: EventConfig[];
}
