import { formatEtherOrWei } from '../../../utils/formatting';
import { wagmiConfig } from '../../../config';

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
    const match = input.match(/^fund (\d+(?:\.\d+)?|\.\d+)$/);
    if (!match) {
        throw new Error("Invalid format. Use: fund <amount> (ETH)");
    }

    const amount = parseFloat(match[1]);
    if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }

    // Convert to wei (assuming 18 decimals)
    return BigInt(Math.floor(amount * 1e18));
}

export function parseWithdrawInput(input: string): bigint {
    const match = input.match(/^withdraw (\d+(?:\.\d+)?|\.\d+)$/);
    if (!match) {
        throw new Error("Invalid format. Use: withdraw <amount> (ETH)");
    }

    const amount = parseFloat(match[1]);
    if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
    }

    // Convert to wei (assuming 18 decimals)
    return BigInt(Math.floor(amount * 1e18));
}

export function decodePlayResult(result: readonly [bigint, bigint, bigint]): {
    diceResult: number;
    won: boolean;
    payout: bigint;
    streakLength: number;
} {
    const [diceResult, payout, streakLength] = result;
    const won = payout > 0;

    return {
        diceResult: Number(diceResult),
        won,
        payout,
        streakLength: Number(streakLength)
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
