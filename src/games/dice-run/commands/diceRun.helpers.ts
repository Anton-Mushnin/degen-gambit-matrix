import { formatEtherOrWei } from '../../../utils/formatting';
import { wagmiConfig } from '../../../config';
import { decodeAbiParameters } from 'viem';

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

export function parseFundInput(input: string): bigint {
    const match = input.match(/^fund (\d+)$/);
    if (!match) {
        throw new Error("Invalid format. Use: fund <amount> (WEI)");
    }

    const amount = parseInt(match[1]);
    if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }

    // Amount is already in wei
    return BigInt(amount);
}

export function parseWithdrawInput(input: string): bigint {
    const match = input.match(/^withdraw (\d+)$/);
    if (!match) {
        throw new Error("Invalid format. Use: withdraw <amount> (WEI)");
    }

    const amount = parseInt(match[1]);
    if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }

    // Amount is already in wei
    return BigInt(amount);
}

export function decodePlayResult(rollOutcome: readonly [bigint, `0x${string}`]): {
    diceResult: number;
    won: boolean;
    payout: bigint;
    streakLength: number;
} {
    const payout = rollOutcome[0];
    const won = payout > 0;
    const additionalData = rollOutcome[1];

    // Decode the additionalData - assuming it contains [diceResult, streakLength] encoded
    // For now, let's assume the format matches what we'll implement in the contract
    // We'll need to adjust this based on the actual contract implementation
    const decodedData = decodeAbiParameters(
        [{ type: 'uint8' }, { type: 'uint8' }],
        additionalData
    );

    const diceResult = Number(decodedData[0]);
    const streakLength = Number(decodedData[1]);

    return {
        diceResult,
        won,
        payout,
        streakLength
    };
}

export function formatPlayOutcome(
    diceResult: number,
    won: boolean,
    payout: bigint,
    streakLength: number,
    chainId: number
): { output: string[]; outcome: string[] } {
    const output = [diceResult.toString()];
    const outcome = [];

    const gameChain = wagmiConfig.chains.find(chain => chain.id === chainId) || wagmiConfig.chains[0];

    if (won) {
        const formattedPayout = formatEtherOrWei(payout, gameChain.nativeCurrency.decimals ?? 18);
        outcome.push(`You rolled ${diceResult}! You won ${formattedPayout.formatted} ${gameChain.nativeCurrency.symbol}`);

        if (streakLength >= 3) {
            outcome.push(`Streak bonus activated! Current streak: ${streakLength}`);
        }
    } else {
        outcome.push(`The Matrix has you... You rolled ${diceResult}. Streak reset.`);
    }

    return { output, outcome };
}

export function formatFundOutcome(
    netInvestment: bigint,
    sharesReceived: bigint,
    chainId: number
): { output: string[]; outcome: string[] } {
    const gameChain = wagmiConfig.chains.find(chain => chain.id === chainId) || wagmiConfig.chains[0];
    const formattedInvestment = formatEtherOrWei(netInvestment, gameChain.nativeCurrency.decimals ?? 18);

    const output = [`Invested ${formattedInvestment.formatted} ${gameChain.nativeCurrency.symbol}`];
    const outcome = [`Bank investment successful! Received ${sharesReceived} shares.`];

    return { output, outcome };
}

export function formatWithdrawOutcome(
    amount: bigint,
    chainId: number
): { output: string[]; outcome: string[] } {
    const gameChain = wagmiConfig.chains.find(chain => chain.id === chainId) || wagmiConfig.chains[0];
    const formattedAmount = formatEtherOrWei(amount, gameChain.nativeCurrency.decimals ?? 18);

    const output = [`Withdrew ${formattedAmount.formatted} ${gameChain.nativeCurrency.symbol}`];
    const outcome = [`Bank withdrawal successful!`];

    return { output, outcome };
}
