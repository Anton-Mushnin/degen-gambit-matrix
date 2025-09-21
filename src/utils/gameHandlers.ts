// External library imports
import { Account } from "thirdweb/wallets";
import { ThirdwebClient } from "thirdweb";
import { PublicClient } from "viem";

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

/**
 * Generalized handler for commit-reveal game actions with automatic prize acceptance
 *
 * @example
 * ```typescript
 * // For a dice game with different timing
 * const result = await handleCommitRevealAccept({
 *   input: "roll dice",
 *   params: terminalParams,
 *   config: {
 *     spinFunction: diceRollFunction,
 *     onWinState: setDiceWinState,
 *     onAccept: acceptDicePrize,
 *     winDelay: 5000, // 5 seconds
 *     acceptDelay: 15000, // 15 seconds
 *     winDetection: (result) => result.prize && Number(result.prize) > 10 // Custom win condition
 *   }
 * });
 * ```
 */
export async function handleCommitRevealAccept({
    input,
    params,
    config
}: {
    input: string;
    params: TerminalCommandParams;
    config: CommitRevealAcceptParams;
}) {
    const { activeAccount, client, publicClient, contractAddress } = params;

    if (!client || !publicClient) {
        return { output: ["No account selected or public client not available"] };
    }

    const isBoost = input === "spin boost";
    const spinResult = await config.spinFunction(contractAddress, isBoost, activeAccount, client, publicClient);

    // Default win detection: check if prize exists and is greater than 0
    const isWin = config.winDetection ? config.winDetection(spinResult) :
                   (spinResult.prize && Number(spinResult.prize) > 0);

    // Handle win state and auto-accept
    if (isWin) {
        const winDelay = config.winDelay ?? 8000; // Default 8 seconds
        const acceptDelay = config.acceptDelay ?? 18000; // Default 18 seconds

        // Set win state after specified delay
        if (config.onWinState) {
            setTimeout(() => config.onWinState!(true), winDelay);
        }

        // Auto-accept after specified delay
        if (config.onAccept) {
            setTimeout(async () => {
                if (config.onWinState) config.onWinState!(false);
                await config.onAccept!(contractAddress, activeAccount, client, publicClient);
            }, acceptDelay);
        }
    }

    return {
        output: [spinResult.description],
        outcome: spinResult.outcome ? [...spinResult.outcome.slice(0, 3)] : undefined,
        isPrize: isWin
    };
}