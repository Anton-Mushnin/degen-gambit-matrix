import { formatUnits } from 'viem';

// Conditional formatting: display in WEI if less than threshold ETH, otherwise display in ETH
export const formatEtherOrWei = (value: bigint, thresholdEth: number = 0.001): { formatted: string; decimals: number } => {
    const ethValue = Number(formatUnits(value, 18));
    if (ethValue < thresholdEth && ethValue > 0) {
        return {
            formatted: `${value.toString()} WEI`,
            decimals: 0
        };
    } else {
        return {
            formatted: `${formatUnits(value, 18)} ETH`,
            decimals: 18
        };
    }
};
