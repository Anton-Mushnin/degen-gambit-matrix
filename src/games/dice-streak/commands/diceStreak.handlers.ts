import { handleCommitRevealAccept, TerminalCommandParams } from "../../../utils/gameHandlers";
import { commitRevealSpin } from '../../../utils/commitRevealSpin';
import { accept } from '../contractFunctions/write';
import { diceStreakABI } from '../../../ABIs/DiceStreak.abi';

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
    const { gameParams } = params;
    const { setIsWin } = gameParams;

    // Parse the guess from input (format: "play 3")
    const match = input.match(/^play (\d)$/);
    if (!match) {
        return { output: ["Invalid format. Use: play <number> (1-6)"] };
    }

    const guess = parseInt(match[1]);
    if (guess < 1 || guess > 6) {
        return { output: ["Guess must be between 1 and 6"] };
    }

    // Create a dice-streak specific spin function that handles both commit and reveal
    const diceStreakCommit = async (contractAddress: string, _isBoost: boolean, activeAccount: any, client: any, publicClient: any) => {

        const chainId = await publicClient.getChainId();

        // Get the bet amount
        const viemContract = {
            address: contractAddress,
            abi: diceStreakABI,
        } as const;

        const betAmount = await publicClient.readContract({
            ...viemContract,
            functionName: 'getBetAmount',
        });

        // Use commitRevealSpin for both commit and reveal phases
        const result = await commitRevealSpin({
            contractAddress,
            contractABI: diceStreakABI,
            spinFunctionName: 'play',
            spinArgs: [guess],
            value: betAmount,
            account: activeAccount,
            client,
            publicClient,
            chainId,
        });

        // Extract prize from outcome - DiceStreak inspectOutcome returns [prizeValue, description]
        const outcome = result.outcome as readonly [bigint, string];
        const prizeValue = Number(outcome[0]);

        return {
            description: `Bet committed for guess ${guess}. Results revealed.`,
            outcome: result.outcome,
            prize: prizeValue > 0 ? prizeValue.toString() : '0',
            prizeType: 0,
            receipt: result.receipt,
        };
    };

    const result = await handleCommitRevealAccept({
        input,
        params,
        config: {
            spinFunction: diceStreakCommit,
            onWinState: setIsWin,
            onAccept: accept,
            winDelay: 8000, // Time to wait before showing win state (for pending bets)
            acceptDelay: 18000, // Minimal delay since accept() processes immediately
        }
    });

    // Ensure isPrize is boolean | undefined, not boolean | "" | undefined
    return {
        ...result,
        isPrize: typeof result.isPrize === 'boolean' ? result.isPrize : undefined
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
