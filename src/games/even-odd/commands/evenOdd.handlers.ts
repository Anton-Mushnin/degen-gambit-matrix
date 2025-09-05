// External library imports
import { Account } from "thirdweb/wallets";
import { ThirdwebClient } from "thirdweb";

// Local imports
import { 
    setupClient, 
    placeBet, 
    checkHasCommit, 
    checkHasFreeSpin 
} from '../utils/commands';

export type EvenOddCommandParams = {
    onAutoReveal?: (choice: string) => void;
    onFreeSpin?: (choice: string) => void;
    setIsWin: (isWin: boolean) => void;
    autoReveal: boolean;
};

export type TerminalCommandParams = {
    activeAccount: Account | undefined;
    client: ThirdwebClient;
    gameParams: EvenOddCommandParams;
};

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (eventName: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
        };
    }
}

export async function handleOdd({ params }: { params: TerminalCommandParams }) {
    const { activeAccount, client, gameParams } = params;
    const { onAutoReveal } = gameParams;
    
    const { _client, account } = setupClient(activeAccount, client);

    if (!_client) {
        return { output: ["No account selected"] };
    }

    try {
        const playerAddress = account?.address || activeAccount?.address;
        if (!playerAddress) {
            throw new Error("No player address available");
        }

        // Check if player already has a commit using command function
        const hasCommit = await checkHasCommit(playerAddress);

        if (hasCommit) {
            return { output: ["You have a pending bet. Wait for auto-reveal."] };
        }

        // Check if player has free spin available
        const hasFreeSpin = await checkHasFreeSpin(playerAddress);
        const isFreeSpin = hasFreeSpin;

        const hash = await placeBet("odd", isFreeSpin, account, _client);
        
        // Schedule auto-reveal after 1 block
        setTimeout(() => {
            onAutoReveal?.("odd");
        }, 12000); // ~12 seconds for 1 block

        const betAmount = isFreeSpin ? "0" : "1000";
        return { 
            output: [`Bet committed: ODD (${betAmount} WEI). Auto-reveal in 1 block.`],
            data: { hash, choice: "odd" }
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to place bet: ${errorMessage}`] };
    }
}

export async function handleEven({ params }: { params: TerminalCommandParams }) {
    const { activeAccount, client, gameParams } = params;
    const { onAutoReveal } = gameParams;
    
    const { _client, account } = setupClient(activeAccount, client);

    if (!_client) {
        return { output: ["No account selected"] };
    }

    try {
        const playerAddress = account?.address || activeAccount?.address;
        if (!playerAddress) {
            throw new Error("No player address available");
        }

        // Check if player already has a commit using command function
        const hasCommit = await checkHasCommit(playerAddress);

        if (hasCommit) {
            return { output: ["You have a pending bet. Wait for auto-reveal."] };
        }

        // Check if player has free spin available
        const hasFreeSpin = await checkHasFreeSpin(playerAddress);
        const isFreeSpin = hasFreeSpin;

        const hash = await placeBet("even", isFreeSpin, account, _client);
        
        // Schedule auto-reveal after 1 block
        setTimeout(() => {
            onAutoReveal?.("even");
        }, 12000); // ~12 seconds for 1 block

        const betAmount = isFreeSpin ? "0" : "1000";
        return { 
            output: [`Bet committed: EVEN (${betAmount} WEI). Auto-reveal in 1 block.`],
            data: { hash, choice: "even" }
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to place bet: ${errorMessage}`] };
    }
}

export async function handleHelp({ input }: { input: string }) {
    const helpText = [
        `Command not found: "${input}"`,
        '',
        'Available commands:',
        '• odd - Commit bet that number will be odd',
        '• even - Commit bet that number will be even',
        '',
        'Current bet: 1000 WEI | Win payout: 1400 WEI | Auto-reveal: 1 blocks'
    ];

    return { output: helpText };
}
