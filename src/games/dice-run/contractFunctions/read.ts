import { PublicClient } from 'viem';
import { formatEtherOrWei } from '../../../utils/formatting';
import { diceRunABI } from './DiceRun.abi';

// Read functions for DiceRun contract

export const getBetAmount = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const betAmount = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getBetAmount',
        });

        const formatted = formatEtherOrWei(betAmount as bigint, 0.00001);
        return {
            value: betAmount as bigint,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get bet amount: ${error}`);
    }
};

export const getPayoutCalculation = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const multiplier = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getBasicPayoutMultiplier',
        });

        const multiplierValue = multiplier as bigint;

        return {
            value: multiplierValue,
            formatted: `${Number(multiplierValue) / 1000}x`,
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get payout calculation: ${error}`);
    }
};

export const getStreakBankSharePercentages = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const shares = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getStreakBankShares',
        });

        const sharesArray = shares as readonly bigint[];
        const tableData = Array.from(sharesArray).map((share, index) => [
            (index + 3).toString(), // streak lengths 3, 4, 5, 6
            `${Number(share) / 100}%`
        ]);

        return tableData;
    } catch (error) {
        throw new Error(`Failed to get streak bank share percentages: ${error}`);
    }
};

export const getInvestmentFeePercent = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const feePercent = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getInvestmentFeePercent',
        });

        return {
            value: feePercent as bigint,
            formatted: `${Number(feePercent as bigint) / 100}%`,
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get investment fee percent: ${error}`);
    }
};

export const getBankBalance = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const balance = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getBankBalance',
        });

        const formatted = formatEtherOrWei(balance as bigint, 0.00001);
        return {
            value: balance as bigint,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get bank balance: ${error}`);
    }
};

export const getBestStreak = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const [length, player] = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getBestStreak',
        });

        return {
            value: length as bigint,
            formatted: `${length} by ${player.slice(0, 6)}...${player.slice(-4)}`,
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get best streak: ${error}`);
    }
};

export const getDiceStatistics = async (contractAddress: string, publicClient: PublicClient) => {
    try {
        const statsPromises = [1, 2, 3, 4, 5, 6].map(num =>
            publicClient.readContract({
                address: contractAddress as `0x${string}`,
                abi: diceRunABI,
                functionName: 'getDiceStats',
                args: [BigInt(num)],
            })
        );

        const statsResults = await Promise.all(statsPromises);

        const tableData = statsResults.map((stats, index) => {
            const [occurrences, bets, wins] = stats as [bigint, bigint, bigint];
            return [
                (index + 1).toString(),
                occurrences.toString(),
                bets.toString(),
                wins.toString()
            ];
        });

        return tableData;
    } catch (error) {
        throw new Error(`Failed to get dice statistics: ${error}`);
    }
};

export const getCurrentShareValue = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const currentShareValue = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getCurrentShareValue',
            args: [playerAddress as `0x${string}`],
        });

        const formatted = formatEtherOrWei(currentShareValue as bigint, 0.00001);
        return {
            value: currentShareValue as bigint,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get current share value: ${error}`);
    }
};

export const getSharePercentage = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const [, sharePercentage] = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getPlayerBankInfo',
            args: [playerAddress as `0x${string}`],
        });

        return {
            value: sharePercentage as bigint,
            formatted: `${Number(sharePercentage as bigint) / 100}%`,
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get share percentage: ${error}`);
    }
};

export const getShareChange = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const change = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getPlayerShareChange',
            args: [playerAddress as `0x${string}`],
        });

        const changeValue = change as bigint;
        const formatted = formatEtherOrWei(changeValue < 0 ? -changeValue : changeValue, 0.00001);
        return {
            value: changeValue,
            formatted: (changeValue >= 0 ? '+' : '-') + formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get share change: ${error}`);
    }
};

export const getPlayerTotalWinnings = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const winnings = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getPlayerTotalWinnings',
            args: [playerAddress as `0x${string}`],
        });

        const formatted = formatEtherOrWei(winnings as bigint, 0.00001);
        return {
            value: winnings as bigint,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get player total winnings: ${error}`);
    }
};

export const getPlayerCurrentStreak = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const streak = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getPlayerCurrentStreak',
            args: [playerAddress as `0x${string}`],
        });

        return {
            value: streak as bigint,
            formatted: streak.toString(),
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get player current streak: ${error}`);
    }
};

export const getNextNeededDiceNumber = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const nextNumber = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getNextNeededDiceNumber',
            args: [playerAddress as `0x${string}`],
        });

        return {
            value: nextNumber as bigint,
            formatted: nextNumber.toString(),
            decimals: 0
        };
    } catch (error) {
        throw new Error(`Failed to get next needed dice number: ${error}`);
    }
};

export const getPotentialBonusAmount = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const bonus = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getPotentialBonusAmount',
            args: [playerAddress as `0x${string}`],
        });

        const formatted = formatEtherOrWei(bonus as bigint, 0.00001);
        return {
            value: bonus as bigint,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get potential bonus amount: ${error}`);
    }
};

export const getTotalWithdrawals = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const withdrawals = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getTotalWithdrawals',
            args: [playerAddress as `0x${string}`],
        });

        const formatted = formatEtherOrWei(withdrawals as bigint, 0.00001);
        return {
            value: withdrawals as bigint,
            formatted: formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get total withdrawals: ${error}`);
    }
};

export const getTotalEarnings = async (contractAddress: string, playerAddress: string, publicClient: PublicClient) => {
    try {
        const earnings = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: diceRunABI,
            functionName: 'getTotalEarnings',
            args: [playerAddress as `0x${string}`],
        });

        const earningsValue = earnings as bigint;
        const formatted = formatEtherOrWei(earningsValue < 0 ? -earningsValue : earningsValue, 0.00001);
        return {
            value: earningsValue,
            formatted: (earningsValue >= 0 ? '+' : '-') + formatted.formatted,
            decimals: formatted.decimals
        };
    } catch (error) {
        throw new Error(`Failed to get total earnings: ${error}`);
    }
};