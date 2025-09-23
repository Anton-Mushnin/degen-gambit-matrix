import { Game } from '../types';
import { CommandDefinition } from '../../commands/types';
import { diceStreakCommands } from './commands/diceStreak';
import { NETWORKS } from '../../config/networks';

// Import components
import DiceStreak from './components/DiceStreak';
import ContractInfo from './components/ContractInfo';
import Stream from './components/Stream';

// Import hooks and context
import { DiceStreakProvider } from './contexts/DiceStreakContext';

// Create the DiceStreak game module
export const diceStreakGame: Game = {
    id: 'dice-streak',
    name: 'Dice Streak',
    description: 'A dice guessing game with streak bonuses and combo rewards',
    version: '1.0.0',
    commands: diceStreakCommands as CommandDefinition<unknown>[],
    components: {
        main: DiceStreak as React.ComponentType<unknown>,
        contractInfo: ContractInfo as React.ComponentType<unknown>,
        stream: Stream as React.ComponentType<unknown>,
    },
    hooks: {
    },
    context: DiceStreakProvider,
    config: {
        contractAddress: '0x874b7ebEE68624303aBA0D09eFd2EA3ee8385080',
        privateKey: '',
        wagmiConfig: null, // Will be set dynamically
    },
    network: NETWORKS.XAI_TESTNET,
};

// Export individual components and hooks for backward compatibility
export { default as DiceStreak } from './components/DiceStreak';
export { default as ContractInfo } from './components/ContractInfo';
export { default as Stream } from './components/Stream';

export { useDiceStreakContext, DiceStreakProvider } from './contexts/DiceStreakContext';
export { useAccountToUse } from '../../hooks';

export { diceStreakCommands } from './commands/diceStreak';
export * from './commands/diceStreak.handlers';

// Export TerminalOutput from matrixUI
export { TerminalOutput } from '../../components/matrixUI/TerminalOutput';

// Default export for the game module
export default diceStreakGame;
