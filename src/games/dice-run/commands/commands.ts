/**
 * COMMAND MODULE PATTERN
 *
 * This module defines game commands using a three-file pattern:
 *
 * 1. commands.ts (this file) - Command definitions
 *    - Exports array of CommandDefinition objects
 *    - Each command has: pattern (regex, name, description, usage), handler, flags, cache invalidation
 *    - Flags: isAutoCommand (auto-triggers after execution), isDevCommand (dev mode only)
 *    - queriesToInvalidate: cache keys to refresh after command execution
 *
 * 2. diceRun.handlers.ts - Handler implementations
 *    - Receives { input, params } where params contains: contractAddress, contractABI, publicClient, activeAccount, client
 *    - Returns { output, outcome?, isPrize? } - output for terminal, outcome for notifications
 *    - Handles all blockchain interactions, error handling
 *
 * 3. diceRun.helpers.ts - Pure utility functions
 *    - Input parsing and validation
 *    - Result decoding from contract responses
 *    - Output formatting
 *
 * Flow: User input → pattern match → handler → helpers → blockchain → response formatting → terminal output
 */

// Local imports
import { CommandDefinition, CommandPattern } from '../../../commands/types';
import {
    handlePlay,
    handleFund,
    handleWithdraw,
    handleAccept,
} from './diceRun.handlers';
import { TerminalCommandParams } from '../../../utils/gameHandlers';

export const diceRunCommands: CommandDefinition<TerminalCommandParams>[] = [
    {
        pattern: {
            pattern: /^play (\d)$/,
            name: 'play',
            description: 'Bet on a number (1-6). Consecutive wins build a streak with bonus payouts.',
            usage: 'play <number> (1-6)'
        },
        handler: handlePlay,
        isAutoCommand: true,
        queriesToInvalidate: [
            'playerBalance',
            'playerTotalWinnings',
            'playerCurrentStreak',
            'bankBalance',
            'nextNeededDiceNumber',
            'potentialBonusAmount',
            'bestStreak',
            'diceStatistics'
        ]
    },
    {
        pattern: {
            pattern: /^fund (\d+(?:\.\d+)?|\.\d+)$/,
            name: 'fund',
            description: 'Invest ETH into the bank to receive ownership shares',
            usage: 'fund <amount> (ETH)'
        },
        handler: handleFund,
        queriesToInvalidate: [
            'playerBalance',
            'bankBalance',
            'amountInvested',
            'sharePercentage',
            'shareChange'
        ]
    },
    {
        pattern: {
            pattern: /^withdraw (\d+(?:\.\d+)?|\.\d+)$/,
            name: 'withdraw',
            description: 'Withdraw up to your share of the bank based on ownership percentage',
            usage: 'withdraw <amount> (ETH)'
        },
        handler: handleWithdraw,
        queriesToInvalidate: [
            'playerBalance',
            'bankBalance',
            'amountInvested',
            'sharePercentage',
            'shareChange'
        ]
    },
    {
        pattern: {
            pattern: /^accept$/,
            name: 'accept',
            description: 'Accept and reveal the results of your committed bet',
            usage: 'accept'
        },
        handler: handleAccept,
        isAutoCommand: true,
        queriesToInvalidate: [
            'playerBalance',
            'playerTotalWinnings',
            'playerCurrentStreak',
            'bankBalance',
            'bestStreak',
            'diceStatistics'
        ]
    },
    {
        isDefault: true,
        handler: async ({ input, params }) => {
            const devModeContext = (params as any)?.devModeContext;
            const availableCommands = diceRunCommands
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
