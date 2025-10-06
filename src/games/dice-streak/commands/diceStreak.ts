// Local imports
import { CommandDefinition, CommandPattern } from '../../../commands/types';
import {
    handlePlay,
    handleAccept,
    handleSetDice,
    handleUnsetDice,
} from './diceStreak.handlers';
import { TerminalCommandParams } from '../../../utils/gameHandlers';

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (eventName: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
        };
    }
}

export const diceStreakCommands: CommandDefinition<TerminalCommandParams>[] = [
    {
        pattern: {
            pattern: /^play (\d)$/,
            name: 'play',
            description: 'Guess a number 1-6 and place a bet',
            usage: 'play <number> (1-6)'
        },
        handler: handlePlay,
        isAutoCommand: true,
        queriesToInvalidate: ['playerBalance', 'playerStreak', 'comboPossibility', 'playerTotalWinnings', 'prizeToClaim', 'bankBalance']
    },
    {
        pattern: {
            pattern: /^accept$/,
            name: 'accept',
            description: 'Accept and reveal results for pending bet',
            usage: 'accept'
        },
        handler: handleAccept,
        queriesToInvalidate: ['prizeToClaim', 'playerBalance', 'playerStreak', 'comboPossibility', 'playerTotalWinnings', 'bankBalance']
    },
    {
        pattern: {
            pattern: /^setDice(\d)$|^setDice (\d)$/,
            name: 'setDice',
            description: 'Set predetermined dice outcome for dev mode (1-6)',
            usage: 'setDice<number> or setDice <number> (1-6)'
        },
        handler: handleSetDice,
        isDevCommand: true,
        queriesToInvalidate: []
    },
    {
        pattern: {
            pattern: /^unsetDice$/,
            name: 'unsetDice',
            description: 'Clear predetermined dice outcome for dev mode',
            usage: 'unsetDice'
        },
        handler: handleUnsetDice,
        isDevCommand: true,
        queriesToInvalidate: []
    },
    {
        isDefault: true,
        handler: async ({ input, params }) => {
            const devModeContext = (params as any)?.devModeContext;
            const availableCommands = diceStreakCommands
                .filter((cmd): cmd is CommandDefinition<TerminalCommandParams> & { pattern: CommandPattern } =>
                    cmd.pattern !== undefined)
                .filter(cmd => !cmd.isDevCommand || (devModeContext?.isDevMode ?? true));

            const helpText = [
                `Command not found: "${input}"`,
                '',
                'Available commands:',
                ...availableCommands.map(cmd => `• ${cmd.pattern.name}: ${cmd.pattern.description}`),
                '',
                'Usage examples:',
                ...availableCommands.map(cmd => `  ${cmd.pattern.usage}`)
            ];

            return { output: helpText };
        }
    }
];
