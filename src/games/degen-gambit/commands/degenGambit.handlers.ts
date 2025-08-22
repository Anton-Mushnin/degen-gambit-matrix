// External library imports
import { Account } from "thirdweb/wallets";
import { ThirdwebClient } from "thirdweb";
import { createWalletClient, http, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Local imports
import { contractAddress, privateKey, wagmiConfig } from '../../../config';
import { _accept, _acceptThirdWebClient, spin } from "../../../utils/degenGambit";

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

// Helper function for client setup (used by spin and accept commands)
function setupClient(activeAccount: Account | undefined, client: ThirdwebClient): {
    _client: WalletClient | ThirdwebClient | undefined;
    account: Account | undefined;
} {
    let _client: WalletClient | ThirdwebClient | undefined;
    let account: Account | undefined;
    
    if (privateKey) {
        _client = createWalletClient({
            account: privateKeyToAccount(privateKey),
            chain: wagmiConfig.chains[0],
            transport: http()
        });
    } else {
        if (window.ethereum && activeAccount?.address) {
            _client = client;
        }
        account = activeAccount;
    }
    
    return { _client, account };
}

export async function handleGetSome({ params }: { params: TerminalCommandParams }) {
    window.open(
        `https://getsome.game7.io?network=testnet&address=${params.activeAccount?.address}`,
        "_blank"
    );
    return { output: [] };
}

export async function handleSpin({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { activeAccount, client, gameParams } = params;
    const { setIsWin } = gameParams;
    
    const { _client, account } = setupClient(activeAccount, client);

    if (!_client) {
        return { output: ["No account selected"] };
    }

    const isBoost = input === "spin boost";
    const spinResult = await spin(contractAddress, isBoost, account, _client);

    // Handle win state and auto-accept
    if (spinResult.prize && Number(spinResult.prize) > 0) {
        // Set win state after 8 seconds
        setTimeout(() => setIsWin(true), 8000);
        
        // Auto-accept after 20 seconds
        setTimeout(async () => {
            setIsWin(false);
            
            // Auto-accept logic
            if (privateKey) {
                const acceptClient = createWalletClient({
                    account: privateKeyToAccount(privateKey),
                    chain: wagmiConfig.chains[0],
                    transport: http()
                });
                await _accept(contractAddress, acceptClient);
            } else if (activeAccount) {
                await _acceptThirdWebClient(contractAddress, activeAccount, client);
            }
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
    const { activeAccount, client } = params;
    
    const { _client } = setupClient(activeAccount, client);

    if (!_client) {
        return { output: ["No account selected"] };
    }

    try {
        if (privateKey) {
            await _accept(contractAddress, _client as WalletClient);
        } else {
            await _acceptThirdWebClient(contractAddress, activeAccount, _client as ThirdwebClient);
        }
        return { output: ["Prize accepted successfully"] };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to accept prize: ${errorMessage}`] };
    }
}

 