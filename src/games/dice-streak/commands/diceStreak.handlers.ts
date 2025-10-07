import { TerminalCommandParams } from "../../../utils/gameHandlers";
import { accept, setPredeterminedResult } from '../contractFunctions/write';
import { commitRevealAccept } from "../../../utils/commitRevealAccept";
import { parsePlayInput, decodePlayResult, formatPlayOutcome } from "./diceStreak.helpers";
import { getBetAmount } from "../contractFunctions/read";

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

    try {
        const guess = parsePlayInput(input);

        if (!publicClient) {
            throw new Error("Public client not available");
        }

        const betAmount = await getBetAmount(contractAddress as `0x${string}`, publicClient);
        const chainId = await publicClient.getChainId();

        const result = await commitRevealAccept({
            contractAddress,
            contractABI: contractABI,
            commitFunctionName: 'play',
            commitArgs: [guess],
            value: betAmount.value,
            account: activeAccount,
            client,
            publicClient,
            chainId,
        });

        const rollOutcome = result.outcome as readonly [bigint, `0x${string}`];
        const { prizeValue, isPrize, diceResult } = decodePlayResult(rollOutcome);
        const formatted = formatPlayOutcome(diceResult, isPrize, prizeValue, chainId);

        return {
            ...formatted,
            isPrize,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [errorMessage] };
    }
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

export async function handleSetDice({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { activeAccount, client, publicClient, contractAddress } = params;

    if (!client || !publicClient) {
        return { output: ["No account selected or public client not available"] };
    }

    // Parse the dice number from input (format: "setDice3" or "setDice 3")
    const match = input.match(/^setDice(\d)$/) || input.match(/^setDice (\d)$/);
    if (!match) {
        return { output: ["Invalid format. Use: setDice<number> (1-6) or setDice <number> (1-6)"] };
    }

    const diceNumber = parseInt(match[1]);
    if (diceNumber < 1 || diceNumber > 6) {
        return { output: ["Dice number must be between 1 and 6"] };
    }

    try {
        const receipt = await setPredeterminedResult(contractAddress, diceNumber, activeAccount, client, publicClient);
        return {
            output: [`Set predetermined dice result to ${diceNumber}`, `Transaction: ${receipt}`]
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to set predetermined result: ${errorMessage}`] };
    }
}

export async function handleUnsetDice({ params }: { params: TerminalCommandParams }) {
    const { activeAccount, client, publicClient, contractAddress } = params;

    if (!client || !publicClient) {
        return { output: ["No account selected or public client not available"] };
    }

    try {
        const receipt = await setPredeterminedResult(contractAddress, 0, activeAccount, client, publicClient);
        return {
            output: [`Cleared predetermined dice result`, `Transaction: ${receipt}`]
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to clear predetermined result: ${errorMessage}`] };
    }
}
