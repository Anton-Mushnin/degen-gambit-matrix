import { TerminalCommandParams } from "../../../utils/gameHandlers";
import { accept } from '../contractFunctions/write';
import { commitRevealAccept } from "../../../utils/commitRevealAccept";


declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (eventName: string, handler: (...args: unknown[]) => void) => void;
            removeListener: (eventName: string, handler: (...args: unknown[]) => void) => void;
        };
    }
}

export async function handlePlay({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { contractAddress, contractABI, publicClient, activeAccount, client } = params;

    // Parse the guess from input (format: "play 3")
    const match = input.match(/^play (\d)$/);
    if (!match) {
        return { output: ["Invalid format. Use: play <number> (1-6)"] };
    }

    const guess = parseInt(match[1]);
    if (guess < 1 || guess > 6) {
        return { output: ["Guess must be between 1 and 6"] };
    }


    const viemContract = {
        address: contractAddress,
        abi: [{
            name: "getBetAmount",
            type: "function",
            stateMutability: "view",
            inputs: [],
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }]
        }],
    } as const;

    if (!publicClient) {
        throw new Error("Public client not available");
    }

    const betAmount = await publicClient.readContract({
        ...viemContract,
        functionName: 'getBetAmount',
    });

    const chainId = await publicClient.getChainId();


    const result = await commitRevealAccept({
        contractAddress,
        contractABI: contractABI,
        commitFunctionName: 'play',
        commitArgs: [guess],
        value: betAmount,
        account: activeAccount,
        client,
        publicClient,
        chainId,
    });

    return {
        outcome: result.outcome,
    };

}

export async function handleAuto({ params }: { params: TerminalCommandParams }) {
    const { gameParams } = params;
    const { onAutoSpinToggle, autoSpin } = gameParams;
    const output = [`Auto play: ${!autoSpin}`];
    onAutoSpinToggle?.();
    return { output };
}

export async function handleAccept({ params }: { params: TerminalCommandParams }) {
    const { activeAccount, client, publicClient, contractAddress } = params;

    if (!client || !publicClient) {
        return { output: ["No account selected or public client not available"] };
    }

    try {
        const result = await accept(contractAddress, activeAccount, client, publicClient);
        return { output: [result.description] };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to accept results: ${errorMessage}`] };
    }
}
