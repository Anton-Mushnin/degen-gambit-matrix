import { formatEtherOrWei } from '@/utils/formatting';

export const getBankShare = (streakLength: number): number => {
    if (streakLength === 3) return 200; // 2%
    if (streakLength === 4) return 500; // 5%
    if (streakLength === 5) return 1500; // 15%
    if (streakLength === 6) return 5000; // 50%
    return 0;
};

export const checkComboPossibility = (currentStreak: number[], bankBalance: bigint): {
    possibleNumber: number;
    nextPayout: bigint;
} => {

    const possibleNumber: number = 0;
    let nextPayout = BigInt(0);

    // Min combo length is 3, so no point checking streaks shorter than 2
    if (currentStreak.length < 2) {
        return { possibleNumber, nextPayout };
    }

    // Calculate the next number that would continue the arithmetic sequence
    const lastNum = currentStreak[currentStreak.length - 1];
    const secondLastNum = currentStreak[currentStreak.length - 2];
    const nextNum = 2 * lastNum - secondLastNum;

    // Check if the calculated number is in valid range [1,6]
    if (nextNum >= 1 && nextNum <= 6) {

        const newLength = currentStreak.length + 1;
        const bankShare = getBankShare(newLength);
        const bonus = (bankBalance * BigInt(bankShare)) / BigInt(10000);
        return {
            possibleNumber: nextNum,
            nextPayout: bonus,
        };
    }

    return { possibleNumber, nextPayout };


};

export const getComboPossibilityData = (
    currentStreak: number[],
    bankBalance: bigint
): { value: bigint; formatted: string; decimals: number } => {
    const comboInfo = checkComboPossibility(currentStreak, bankBalance);
    if (comboInfo.possibleNumber === 0) {
        return {
            value: BigInt(0),
            formatted: 'No combo possible',
            decimals: 0
        };
    }

    const payout = comboInfo.nextPayout > BigInt(0)
        ? ` → ${formatEtherOrWei(comboInfo.nextPayout).formatted} bonus`
        : '';

    return {
        value: BigInt(comboInfo.nextPayout),
        formatted: `Roll ${comboInfo.possibleNumber}${payout}`,
        decimals: 0
    };
};
