import { decodeAbiParameters } from "viem";
import { wagmiConfig } from "../../../config";
import { formatEtherOrWei } from "@/utils/formatting";

export function parsePlayInput(input: string): number {
    const match = input.match(/^play (\d)$/);
    if (!match) {
        throw new Error("Invalid format. Use: play <number> (1-6)");
    }

    const guess = parseInt(match[1]);
    if (guess < 1 || guess > 6) {
        throw new Error("Guess must be between 1 and 6");
    }

    return guess;
}

export function decodePlayResult(rollOutcome: readonly [bigint, `0x${string}`]): {
    prizeValue: bigint;
    isPrize: boolean;
    diceResult: number;
} {
    const prizeValue = rollOutcome[0];
    const isPrize = prizeValue > 0;
    const additionalData = rollOutcome[1];
    
    // Decode the uint32 result from bytes
    const [decodedResult] = decodeAbiParameters([{ type: 'uint32' }], additionalData);
    const diceResult = Number(decodedResult);

    return { prizeValue, isPrize, diceResult };
}

export function formatPlayOutcome(
    diceResult: number,
    isPrize: boolean,
    prizeValue: bigint,
    chainId: number
): { output: string[]; outcome: string[] } {
    const output = [diceResult.toString()];
    const outcome = [];

    if (isPrize) {
        const gameChain = wagmiConfig.chains.find(chain => chain.id === chainId) || wagmiConfig.chains[0];
        outcome.push(`You rolled ${diceResult}! You won ${formatEtherOrWei(prizeValue, gameChain.nativeCurrency.decimals ?? 18).formatted} ${gameChain.nativeCurrency.symbol}`);
    } else {
        outcome.push(`The Matrix has you...`);
    }

    return { output, outcome };
}

