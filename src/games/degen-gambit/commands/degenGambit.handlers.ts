// External library imports
import { Account } from "thirdweb/wallets";
import { ThirdwebClient } from "thirdweb";
import { type PublicClient } from "viem";
import { handleCommitRevealAccept } from "../../../utils/gameHandlers";

// Local imports
import { accept, spin } from "../degenGambit";

export type SpinResult = {
    description: string;
    outcome?: readonly bigint[];
    prize?: string;
    prizeType?: number;
    receipt?: string | null;
};

export type AcceptResult = {
    description: string;
    success: boolean;
    receipt?: any; // TransactionReceipt or string
    error?: string;
};

export type CommitRevealAcceptParams = {
    spinFunction: (contractAddress: string, isBoost: boolean, activeAccount: Account | undefined, client: ThirdwebClient, publicClient: PublicClient) => Promise<SpinResult>;
    onWinState?: (isWin: boolean) => void;
    onAccept?: (contractAddress: string, activeAccount: Account | undefined, client: ThirdwebClient, publicClient: PublicClient) => Promise<AcceptResult>;
    winDelay?: number; // milliseconds to wait before setting win state
    acceptDelay?: number; // milliseconds to wait before auto-accepting
    winDetection?: (spinResult: SpinResult) => boolean;
};

export type TerminalCommandParams = {
    activeAccount: Account | undefined;
    client: ThirdwebClient;
    publicClient: PublicClient | null;
    gameParams: any; // Game-specific parameters
    contractAddress: string;
};

export type DegenGambitCommandParams = {
    onSetNumbers?: (numbers: number[]) => void;
    getCurrentNumbers: () => number[];
    onAutoSpinToggle: () => void;
    setIsWin: (isWin: boolean) => void;
    autoSpin: boolean;
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

export async function handleGetSome({ params }: { params: TerminalCommandParams }) {
    window.open(
        `https://getsome.game7.io?network=testnet&address=${params.activeAccount?.address}`,
        "_blank"
    );
    return { output: [] };
}


// Primary spin handler for DegenGambit - uses the generalized commit-reveal-accept logic
export async function handleSpin({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { gameParams } = params;
    const { setIsWin } = gameParams;

    return handleCommitRevealAccept({
        input,
        params,
        config: {
            spinFunction: spin,
            onWinState: setIsWin,
            onAccept: accept,
            winDelay: 8000,
            acceptDelay: 18000
        }
    });
}

export async function handleAuto({ params }: { params: TerminalCommandParams }) {
    const { onAutoSpinToggle, autoSpin } = params.gameParams;
    const output = [`Auto spin: ${!autoSpin}`];
    onAutoSpinToggle?.();
    return { output };
}

export async function handleSet({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { onSetNumbers, getCurrentNumbers } = params.gameParams;
    const [, indexStr, numberStr] = input.split(' ');
    const index = parseInt(indexStr);
    const number = parseInt(numberStr);

    const currentNumbers = getCurrentNumbers();

    if (index < 0 || index >= currentNumbers.length) {
        return { 
            output: [`Invalid index. Must be between 0 and ${currentNumbers.length - 1}`] 
        };
    }

    const newNumbers = [...currentNumbers];
    newNumbers[index] = number;
    
    // Notify component of new numbers
    onSetNumbers?.(newNumbers);
    
    return {
        output: [
            "Minor symbols:", 
            newNumbers.slice(1, 16).join(', '), 
            "Major symbols:", 
            newNumbers.slice(-3).join(', ')
        ]
    };
}

export async function handleAccept({ params }: { params: TerminalCommandParams }) {
    const { activeAccount, client, publicClient, contractAddress } = params;
    
    if (!client || !publicClient) {
        return { output: ["No account selected or public client not available"] };
    }

    try {
        await accept(contractAddress, activeAccount, client, publicClient);
        return { output: ["Prize accepted successfully"] };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to accept prize: ${errorMessage}`] };
    }
}

 