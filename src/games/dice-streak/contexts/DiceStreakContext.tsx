import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useTerminal } from '../../../hooks/useTerminal';
import { useWinEffect } from '../../../contexts/WinEffectContext';

interface GameState {
    autoSpin: boolean;
    isBusy: boolean;
    isProcessing: boolean;
    outcome: string[];
    terminalQueue: {
        length: number;
        shift: () => {text: string, toType: boolean} | undefined;
    };
}

interface GameActions {
    toggleAutoSpin: () => void;
    handleInput: (input: string) => Promise<void>;
    triggerWinEffect: (outcome?: any) => void;
}

type DiceStreakContextType = [GameState, GameActions];

const DiceStreakContext = createContext<DiceStreakContextType | undefined>(undefined);

interface DiceStreakProviderProps {
    children: ReactNode;
}

const phrasesToType = ['Wake up', 'The Matrix', 'Prize'];


export const DiceStreakProvider: React.FC<DiceStreakProviderProps> = ({ children }) => {
    const [autoSpin, setAutoSpin] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const { triggerWinEffect } = useWinEffect();
    const [isProcessing, setIsProcessing] = useState(false);
    const [outcome, setOutcome] = useState<string[]>([]);


    const toggleAutoSpin = useCallback(() => {
        setAutoSpin(prev => !prev);
    }, []);

    const setIsWin = useCallback((isWin: boolean, outcome?: any) => {
        if (isWin) {
            triggerWinEffect(outcome);
        }
    }, [triggerWinEffect]);

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
        setIsBusy(true);

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
                const outcomeValues = (result.outcome as bigint[]).map(o => o.toString());
                setOutcome(outcomeValues);
                setTimeout(() => {
                    setOutputQueue(prev => [...prev, {text: outcomeValues.join(' '), toType: false}]);
                    const outputText = result.output.join('\n');
                    if (outputText) { 
                        setOutputQueue(prev => [...prev, {text: outputText, toType: phrasesToType.some(str => outputText.startsWith(str))}]);
                    }
                    setOutcome([]);
                }, 8000);
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
            setIsBusy(false);
        }
    };

    const terminalQueue = {
        length: outputQueue.length,
        shift: () => {
            const item = outputQueue.shift();
            setOutputQueue([...outputQueue]); // Trigger re-render
            return item;
        }
    };

    const gameState: GameState = {
        autoSpin,
        isBusy,
        isProcessing,
        outcome,
        terminalQueue,
    };

    const gameActions: GameActions = {
        toggleAutoSpin,
        handleInput,
        triggerWinEffect,
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
