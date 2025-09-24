import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useTerminal } from '../../../hooks/useTerminal';

interface GameState {
    isWin: boolean;
    autoSpin: boolean;
    isProcessing: boolean;
    terminalQueue: {
        length: number;
        shift: () => {text: string, toType: boolean} | undefined;
    };
}

interface GameActions {
    setIsWin: (isWin: boolean) => void;
    toggleAutoSpin: () => void;
    handleInput: (input: string) => Promise<void>;
}

type DiceStreakContextType = [GameState, GameActions];

const DiceStreakContext = createContext<DiceStreakContextType | undefined>(undefined);

interface DiceStreakProviderProps {
    children: ReactNode;
}

export const DiceStreakProvider: React.FC<DiceStreakProviderProps> = ({ children }) => {
    const [isWin, setIsWin] = useState(false);
    const [autoSpin, setAutoSpin] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const toggleAutoSpin = useCallback(() => {
        setAutoSpin(prev => !prev);
    }, []);

    useEffect(() => {
        console.log(isWin);
    }, [isWin]);

    const gameParams = {
        setIsWin,
        onAutoSpinToggle: toggleAutoSpin,
        autoSpin,
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
            if (result?.output && !result.outcome) {
                const outputText = result.output.join('\n');
                if (outputText) {
                    setOutputQueue(prev => [...prev, {text: outputText, toType: false}]);
                }
            } else if (result?.outcome) {
                if (autoSpin && input.startsWith('play')) {
                    setTimeout(() => {
                        handleInput('play 1');
                    }, result.isPrize ? 22000 : 13000);
                }
                if (result.outcome && Array.isArray(result.outcome) && result.outcome.length > 0) {
                    setOutputQueue(prev => [...prev, {text: (result.outcome as bigint[]).map(o => o.toString()).join(' '), toType: false}]);
                }
                const outputText = result.output.join('\n');
                if (outputText) {
                    setOutputQueue(prev => [...prev, {text: outputText, toType: false}]);
                }
            }
        } catch (error) {
            if (autoSpin && input.startsWith('play')) {
                setTimeout(() => {
                    handleInput('play 1');
                }, 13000);
            }
            console.error('DiceStreak input error:', error);
            setOutputQueue(prev => [...prev, {text: 'Error processing command', toType: false}]);
        } finally {
            setIsProcessing(false);
        }
    };

    const gameState: GameState = {
        isWin,
        autoSpin,
        isProcessing,
        terminalQueue: outputQueue,
    };

    const gameActions: GameActions = {
        setIsWin,
        toggleAutoSpin,
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
