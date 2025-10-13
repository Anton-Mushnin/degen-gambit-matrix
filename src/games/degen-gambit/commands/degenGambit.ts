// Local imports
import { CommandDefinition, CommandPattern } from '../../../commands/types';
import {
    handleGetSome,
    handleSpin,
    handleAccept,
} from './degenGambit.handlers';
import { TerminalCommandParams, SpinResult, CommitRevealAcceptParams } from '../../../utils/gameHandlers';


export type { SpinResult, TerminalCommandParams, CommitRevealAcceptParams };


declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (eventName: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
        };
    }
}

export const degenGambitCommands: CommandDefinition<TerminalCommandParams>[] = [
    {
        pattern: {
            pattern: /^getsome$/,
            name: 'getsome',
            description: 'Visit getsome.game7.io to get some tokens',
            usage: 'getsome'
        },
        handler: handleGetSome
    },
    {
        pattern: {
            pattern: /^spin( boost)?$/,
            name: 'spin',
            description: 'Spin the wheel (optionally with boost)',
            usage: 'spin [boost]'
        },
        handler: handleSpin
    },
    // {
    //     pattern: {
    //         pattern: /^set \d+ \d+$/,
    //         name: 'set',
    //         description: 'Set a number at a specific index',
    //         usage: 'set <index> <number>'
    //     },
    //     handler: handleSet
    // },
    {
        pattern: {
            pattern: /^accept$/,
            name: 'accept',
            description: 'Accept a pending prize',
            usage: 'accept'
        },
        handler: handleAccept
    },
    {
        isDefault: true,
        handler: async ({ input, params }) => {
            const devModeContext = (params as any)?.devModeContext;
            const availableCommands = degenGambitCommands
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
