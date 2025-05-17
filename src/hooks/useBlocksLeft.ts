import { useState, useEffect, useMemo } from 'react';

// Type for block data
type BlockData = {
    value: bigint;
    formatted: string;
    decimals: number;
};

// Custom hook to manage blocks left calculation
export const useBlocksLeft = (degenAddress: string | undefined, blocksToAct: number | undefined) => {
    const [currentBlock, setCurrentBlock] = useState<BlockData | null>(null);
    const [lastSpinBlock, setLastSpinBlock] = useState<BlockData | null>(null);

    // Calculate blocks left as derived state
    const blocksLeft = useMemo(() => {
        if (!blocksToAct || !currentBlock || !lastSpinBlock) {
            return {
                value: BigInt(0),
                formatted: '0',
                decimals: 0
            };
        }
        
        const deadline = lastSpinBlock.value + BigInt(blocksToAct);
        const _blocksLeft = Number(deadline - currentBlock.value);
        const blocksLeftValue = Math.max(Math.min(_blocksLeft, blocksToAct), 0);
        
        return {
            value: BigInt(blocksLeftValue),
            formatted: blocksLeftValue.toString(),
            decimals: 0,
        };
    }, [currentBlock, lastSpinBlock, blocksToAct]);

    // Handler functions to update the state
    const handleCurrentBlockUpdate = (data: BlockData) => {
        setCurrentBlock(data);
    };

    const handleLastSpinBlockUpdate = (data: BlockData) => {
        setLastSpinBlock(data);
    };

    // Reset state when address changes
    useEffect(() => {
        setLastSpinBlock(null);
    }, [degenAddress]);

    // Function to return blocks left for the Row component
    const getBlocksLeft = async () => blocksLeft;

    return {
        blocksLeft,
        getBlocksLeft,
        handleCurrentBlockUpdate,
        handleLastSpinBlockUpdate
    };
};

export default useBlocksLeft; 