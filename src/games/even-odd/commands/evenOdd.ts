// Local imports
import { CommandDefinition, CommandPattern } from '../../../commands/types';
import { 
    handleOdd, 
    handleEven, 
    handleHelp,
    type TerminalCommandParams,
    type EvenOddCommandParams
} from './evenOdd.handlers';

export type { EvenOddCommandParams, TerminalCommandParams };

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (eventName: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
        };
    }
}

export const evenOddCommands: CommandDefinition<TerminalCommandParams>[] = [
    {
        pattern: {
            pattern: /^odd$/,
            name: 'odd',
            description: 'Commit bet that number will be odd',
            usage: 'odd'
        },
        handler: handleOdd
    },
    {
        pattern: {
            pattern: /^even$/,
            name: 'even',
            description: 'Commit bet that number will be even',
            usage: 'even'
        },
        handler: handleEven
    },
    {
        isDefault: true,
        handler: handleHelp
    }
];
