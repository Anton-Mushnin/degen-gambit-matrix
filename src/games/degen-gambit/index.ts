import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { degenGambitCommands } from './commands/degenGambit';

// Import components
import DegenGambit from './components/DegenGambit';
import Rules from './components/Rules';
import ContractInfo from './components/ContractInfo';
import Stream from './components/Stream';

// Import hooks
import { useDegenGambitGame } from './hooks/useDegenGambitGame';
import { useDegenGambitInfo } from './hooks/useDegenGambitInfo';
import { useAccountToUse } from '../../hooks';

// Create the DegenGambit game module
export const degenGambitGame: Game = {
    id: 'degen-gambit',
    name: 'DegenGambit',
    description: 'A high-stakes blockchain gambling game with matrix-style interface',
    version: '1.0.0',
    commands: degenGambitCommands as CommandDefinition<unknown>[],
    components: {
        main: DegenGambit as React.ComponentType<unknown>,
        rules: Rules as React.ComponentType<unknown>,
        contractInfo: ContractInfo as React.ComponentType<unknown>,
        stream: Stream as React.ComponentType<unknown>,
    },
    hooks: {
        useDegenGambitGame: useDegenGambitGame as (...args: unknown[]) => unknown,
        useDegenGambitInfo: useDegenGambitInfo as (...args: unknown[]) => unknown,
        useAccountToUse: useAccountToUse as (...args: unknown[]) => unknown,
    },
    config: {
        contractAddress: '0xf3BE777A6096E0ff568296aD3BA76811b5b1Fc40',
        privateKey: '',
        wagmiConfig: null, // Will be set dynamically
    },
};

// Export individual components and hooks for backward compatibility
export { default as DegenGambit } from './components/DegenGambit';
export { default as Rules } from './components/Rules';
export { default as ContractInfo } from './components/ContractInfo';
export { default as Stream } from './components/Stream';

export { useDegenGambitGame } from './hooks/useDegenGambitGame';
export { useDegenGambitInfo } from './hooks/useDegenGambitInfo';
export { useAccountToUse } from '../../hooks';

export { degenGambitCommands } from './commands/degenGambit';
export * from './commands/degenGambit.handlers';

// Export TerminalOutput from matrixUI
export { TerminalOutput } from '../../components/matrixUI/TerminalOutput';

// Default export for the game module
export default degenGambitGame; 