import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { degenGambitCommands } from './commands/degenGambit';
import { NETWORKS } from '../../config/networks';

// Import components
import DegenGambit from './components/DegenGambit';
import ContractInfo from './components/ContractInfo';
import Stream from './components/Stream';

// Import hooks and context
import { DegenGambitProvider } from './contexts/DegenGambitContext';

// Create the DegenGambit game module
export const degenGambitGame: Game = {
    id: 'degen-gambit',
    name: 'DegenGambit',
    description: 'A high-stakes blockchain gambling game with matrix-style interface',
    version: '1.0.0',
    commands: degenGambitCommands as CommandDefinition<unknown>[],
    components: {
        main: DegenGambit as React.ComponentType<unknown>,
        contractInfo: ContractInfo as React.ComponentType<unknown>,
        stream: Stream as React.ComponentType<unknown>,
    },
    hooks: {
    },
    context: DegenGambitProvider,
    config: {
        contractAddress: '0xE01c848c4b5e4Ac90746cd7bef27aEF23c9fcEa6',
        privateKey: '',
        wagmiConfig: null, // Will be set dynamically
    },
    network: NETWORKS.XAI_TESTNET,
};

// Export individual components and hooks for backward compatibility
export { default as DegenGambit } from './components/DegenGambit';
export { default as ContractInfo } from './components/ContractInfo';
export { default as Stream } from './components/Stream';

export { useDegenGambitContext, DegenGambitProvider } from './contexts/DegenGambitContext';
export { useAccountToUse } from '../../hooks';

export { degenGambitCommands } from './commands/degenGambit';
export * from './commands/degenGambit.handlers';

// Export TerminalOutput from matrixUI
export { TerminalOutput } from '../../components/matrixUI/TerminalOutput';

// Default export for the game module
export default degenGambitGame; 