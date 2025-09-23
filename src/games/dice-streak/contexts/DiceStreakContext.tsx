import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccountToUse } from '../../../hooks';
import { useTerminal } from '../../../hooks/useTerminal';

interface GameState {
    isWin: boolean;
    isProcessing: boolean;
    terminalQueue: {
        length: number;
        shift: () => {text: string, toType: boolean} | undefined;
    };
}

interface GameActions {
    setIsWin: (isWin: boolean) => void;
    handleInput: (input: string) => Promise<void>;
}

type DiceStreakContextType = [GameState, GameActions];

const DiceStreakContext = createContext<DiceStreakContextType | undefined>(undefined);

interface DiceStreakProviderProps {
    children: ReactNode;
}

export const DiceStreakProvider: React.FC<DiceStreakProviderProps> = ({ children }) => {
    const queryClient = useQueryClient();
    const { address: playerAddress } = useAccountToUse();

    const [isWin, setIsWin] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const gameParams = {
        setIsWin,
    };

    const { handleInput: terminalHandleInput, outputQueue, setOutputQueue } = useTerminal(gameParams);

    const handleInput = async (input: string) => {
        if (input === 'clear') {
            setOutputQueue([]);
            return;
        }

        setIsProcessing(true);

        try {
            const result = await terminalHandleInput(input);
            if (result?.output) {
                const outputText = result.output.join('\n');
                if (outputText) {
                    setOutputQueue(prev => [...prev, {text: outputText, toType: false}]);
                }
            }
        } catch (error) {
            console.error('DiceStreak input error:', error);
            setOutputQueue(prev => [...prev, {text: 'Error processing command', toType: false}]);
        } finally {
            setIsProcessing(false);
        }
    };

    const gameState: GameState = {
        isWin,
        isProcessing,
        terminalQueue: outputQueue,
    };

    const gameActions: GameActions = {
        setIsWin,
        handleInput,
    };

    return (
        <DiceStreakContext.Provider value={[gameState, gameActions]}>
            {children}
        </DiceStreakContext.Provider>
    );
};

export const useDiceStreakContext = (): DiceStreakContextType => {
    const context = useContext(DiceStreakContext);
    if (context === undefined) {
        throw new Error('useDiceStreakContext must be used within a DiceStreakProvider');
    }
    return context;
};
