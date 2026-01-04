/**
 * COMMAND MODULE PATTERN
 * 
 * This module defines game commands using a three-file pattern:
 * 
 * 1. commands.ts (this file) - Command definitions
 *    - Exports array of CommandDefinition objects
 *    - Each command has: pattern (regex, name, description, usage), handler, flags, cache invalidation
 * 
 * 2. handlers.ts - Handler implementations
 *    - Receives { input, params } where params contains: contractAddress, contractABI, publicClient, activeAccount, client
 *    - Returns { output, outcome?, isPrize? }
 * 
 * Flow: User input → pattern match → handler → blockchain → response formatting → terminal output
 */

import { CommandDefinition, CommandPattern } from '../../../commands/types';
import {
    handleGuess,
    handleDeposit,
    handleWithdraw,
} from './handlers';
import { TerminalCommandParams } from '../../../utils/gameHandlers';

export const guessNextNumberCommands: CommandDefinition<TerminalCommandParams>[] = [
    {
        pattern: {
            pattern: /^guess (\d)$/,
            name: 'guess',
            description: 'Guess a number 1-6',
            usage: 'guess <number> (1-6)'
        },
        handler: handleGuess,
        isAutoCommand: true,
        queriesToInvalidate: [
            'playerBalance',
            'playerStatus',
            'playerStreak',
            'playerTotalWinnings',
            'bankBalance',
            'streakBonus3',
            'streakBonus4',
            'streakBonus5',
            'streakBonus6',
            'numberStatistics',
            'bestStreak'
        ]
    },
    {
        pattern: {
            pattern: /^deposit (.+)$/,
            name: 'deposit',
            description: 'Deposit ETH to the bank (1% fee)',
            usage: 'deposit <amount in ETH>'
        },
        handler: handleDeposit,
        queriesToInvalidate: [
            'playerBalance',
            'playerShare',
            'playerShareValue',
            'playerTotalEarnings',
            'bankBalance',
            'streakBonus3',
            'streakBonus4',
            'streakBonus5',
            'streakBonus6'
        ]
    },
    {
        pattern: {
            pattern: /^withdraw (.+)$/,
            name: 'withdraw',
            description: 'Withdraw ETH from the bank (free)',
            usage: 'withdraw <amount in ETH>'
        },
        handler: handleWithdraw,
        queriesToInvalidate: [
            'playerBalance',
            'playerShare',
            'playerShareValue',
            'playerTotalEarnings',
            'bankBalance',
            'streakBonus3',
            'streakBonus4',
            'streakBonus5',
            'streakBonus6'
        ]
    },
    {
        isDefault: true,
        handler: async ({ input, params }) => {
            const devModeContext = (params as any)?.devModeContext;
            const availableCommands = guessNextNumberCommands
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

