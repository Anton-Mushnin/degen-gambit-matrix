import { PublicClient } from 'viem';
import { formatEtherOrWei } from '@/utils/formatting';
import { guessNextNumberABI } from './GuessNextNumber.abi';

const WEI_THRESHOLD = 0.00001; // 10,000,000 WEI

// Contract constants

export const getCostOfPlay = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const cost = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'costOfPlay',
        });

        const formatted = formatEtherOrWei(cost as bigint, WEI_THRESHOLD);
        return {
            value: cost as bigint,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get cost of play: ${error}`);
    }
};

export const getPayoutMultiplier = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const multiplier = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'payoutMultiplier',
        });

        // Multiplier stored as value * 1000 (e.g., 5800 = 5.8x)
        return {
            value: multiplier as bigint,
            formatted: `${Number(multiplier) / 1000}x`,
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get payout multiplier: ${error}`);
    }
};

export const getDepositFee = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const fee = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'depositFeePercent',
        });

        return {
            value: fee as bigint,
            formatted: `${Number(fee)}%`,
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get deposit fee: ${error}`);
    }
};

// Contract variables

export const getBankBalance = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const balance = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getBankBalance',
        });

        const formatted = formatEtherOrWei(balance as bigint, WEI_THRESHOLD);
        return {
            value: balance as bigint,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get bank balance: ${error}`);
    }
};

export const getStreakBonuses = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const [bonus3, bonus4, bonus5, bonus6] = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getStreakBonuses',
        }) as [bigint, bigint, bigint, bigint];

        return { bonus3, bonus4, bonus5, bonus6 };
    } catch (error) {
        throw new Error(`Failed to get streak bonuses: ${error}`);
    }
};

export const getStreakBonus = async (contractAddress: string, publicClient: PublicClient, streakLevel: number) => {
    try {
        const bonuses = await getStreakBonuses(contractAddress, publicClient);
        const bonusMap: Record<number, bigint> = {
            3: bonuses.bonus3,
            4: bonuses.bonus4,
            5: bonuses.bonus5,
            6: bonuses.bonus6
        };
        const bonus = bonusMap[streakLevel] || 0n;

        const formatted = formatEtherOrWei(bonus, WEI_THRESHOLD);
        return {
            value: bonus,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get streak bonus: ${error}`);
    }
};

export const getNumberStatistics = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const stats = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getStatistics',
        }) as readonly { occurrences: bigint }[];

        return stats.map((stat, index) => [
            String(index + 1),
            String(stat.occurrences)
        ]);
    } catch (error) {
        throw new Error(`Failed to get statistics: ${error}`);
    }
};

export const getBestStreak = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const [streakLength, player] = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getBestStreak',
        }) as [number, string];

        const shortAddress = player.slice(0, 6) + '...' + player.slice(-4);
        return {
            value: BigInt(streakLength),
            formatted: streakLength > 0 ? `${streakLength} (${shortAddress})` : 'None',
            decimals: 0,
            copyValue: streakLength > 0 ? player : undefined
        };
    } catch (error) {
        throw new Error(`Failed to get best streak: ${error}`);
    }
};

// Player (game)

export const getPlayerStatus = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const status = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getPlayerStatus',
            args: [playerAddress as `0x${string}`],
        }) as number;

        const statusMap = ['Ready', 'Pending', 'Accepting', 'Accepted'];
        const statusText = statusMap[Number(status)] || 'Unknown';

        return {
            value: BigInt(status),
            formatted: statusText,
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get player status: ${error}`);
    }
};

export const getPlayerStreak = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const streak = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getPlayerStreak',
            args: [playerAddress as `0x${string}`],
        }) as number;

        return {
            value: BigInt(streak),
            formatted: String(streak),
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get player streak: ${error}`);
    }
};

export const getPlayerTotalWinnings = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const winnings = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getPlayerTotalWinnings',
            args: [playerAddress as `0x${string}`],
        }) as bigint;

        const formatted = formatEtherOrWei(winnings, WEI_THRESHOLD);
        return {
            value: winnings,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get player total winnings: ${error}`);
    }
};

// Player (bank)

export const getPlayerShare = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const share = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getPlayerShare',
            args: [playerAddress as `0x${string}`],
        }) as bigint;

        // Share stored as basis points (e.g., 10000 = 100%, 100 = 1%)
        const percentage = Number(share) / 100;
        return {
            value: share,
            formatted: `${percentage.toFixed(2)}%`,
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get player share: ${error}`);
    }
};

export const getPlayerShareValue = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const value = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getPlayerShareValue',
            args: [playerAddress as `0x${string}`],
        }) as bigint;

        const formatted = formatEtherOrWei(value, WEI_THRESHOLD);
        return {
            value: value,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get player share value: ${error}`);
    }
};

export const getPlayerTotalEarnings = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const earnings = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: guessNextNumberABI,
            functionName: 'getPlayerTotalEarnings',
            args: [playerAddress as `0x${string}`],
        }) as bigint;

        // Earnings can be negative (loss)
        const isNegative = earnings < 0n;
        const absValue = isNegative ? -earnings : earnings;
        const formatted = formatEtherOrWei(absValue, WEI_THRESHOLD);
        
        return {
            value: earnings,
            formatted: isNegative ? `-${formatted.formatted}` : formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get player total earnings: ${error}`);
    }
};

