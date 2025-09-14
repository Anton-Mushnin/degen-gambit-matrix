// External library imports
import { Account } from "thirdweb/wallets";
import { ThirdwebClient } from "thirdweb";
import { createWalletClient, http, type WalletClient, type PublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Local imports
import { privateKey, wagmiConfig } from '../../../config';
import { _accept, _acceptThirdWebClient, accept, spin } from "../../../utils/degenGambit";
import { degenGambitGame } from '../index';

export type SpinResult = {
    description: string;
    outcome?: readonly bigint[];
    prize?: string;
    prizeType?: number;
    receipt?: string | null;
};

export type DegenGambitCommandParams = {
    onSetNumbers?: (numbers: number[]) => void;
    getCurrentNumbers: () => number[];
    onAutoSpinToggle: () => void;
    setIsWin: (isWin: boolean) => void;
    autoSpin: boolean;
};

export type TerminalCommandParams = {
    activeAccount: Account | undefined;
    client: ThirdwebClient;
    publicClient: PublicClient | null;
    gameParams: DegenGambitCommandParams;
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

export async function handleSpin({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { activeAccount, client, publicClient, gameParams } = params;
    const { setIsWin } = gameParams;
    

    if (!client || !publicClient) {
        return { output: ["No account selected or public client not available"] };
    }

    const isBoost = input === "spin boost";
    const contractAddress = degenGambitGame.config.contractAddress as string;
    const spinResult = await spin(contractAddress, isBoost, activeAccount, client, publicClient);

    // Handle win state and auto-accept
    if (spinResult.prize && Number(spinResult.prize) > 0) {
        // Set win state after 8 seconds
        setTimeout(() => setIsWin(true), 8000);
        
        // Auto-accept after 20 seconds
        setTimeout(async () => {
            setIsWin(false);
            await accept(contractAddress, activeAccount, client, publicClient);
        }, 18000);
    }

    return {
        output: [spinResult.description],
        outcome: spinResult.outcome ? [...spinResult.outcome.slice(0, 3)] : undefined,
        isPrize: spinResult.prize ? Number(spinResult.prize) > 0 : undefined
    };
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
    const { activeAccount, client, publicClient } = params;
    
    if (!client || !publicClient) {
        return { output: ["No account selected or public client not available"] };
    }

    try {
        const contractAddress = degenGambitGame.config.contractAddress as string;
        await accept(contractAddress, activeAccount, client, publicClient);
        return { output: ["Prize accepted successfully"] };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to accept prize: ${errorMessage}`] };
    }
}

 