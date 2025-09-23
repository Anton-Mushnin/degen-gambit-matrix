// Local imports
import { CommandDefinition, CommandPattern } from '../../../commands/types';
import {
    handlePlay,
    handleAccept,
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
        handler: handlePlay
    },
    {
        pattern: {
            pattern: /^accept$/,
            name: 'accept',
            description: 'Accept and reveal results for pending bet',
            usage: 'accept'
        },
        handler: handleAccept
    },
    {
        isDefault: true,
        handler: async ({ input }) => {
            const helpText = [
                `Command not found: "${input}"`,
                '',
                'Available commands:',
                ...diceStreakCommands
                    .filter((cmd): cmd is CommandDefinition<TerminalCommandParams> & { pattern: CommandPattern } =>
                        cmd.pattern !== undefined)
                    .map(cmd => `• ${cmd.pattern.name}: ${cmd.pattern.description}`),
                '',
                'Usage examples:',
                ...diceStreakCommands
                    .filter((cmd): cmd is CommandDefinition<TerminalCommandParams> & { pattern: CommandPattern } =>
                        cmd.pattern !== undefined)
                    .map(cmd => `  ${cmd.pattern.usage}`)
            ];

            return { output: helpText };
        }
    }
];
