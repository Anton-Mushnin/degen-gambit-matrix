import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { numbers } from '../../../config/symbols';
import { useQueryClient } from '@tanstack/react-query';
import { useAccountToUse } from '../../../hooks';
import { useTerminal } from '../../../hooks/useTerminal';
import { useWinEffect } from '../../../contexts/WinEffectContext';

const phrasesToType = ['Wake up', 'The Matrix', 'Prize'];

interface GameState {
    userNumbers: number[];
    autoSpin: boolean;
    isSpinning: boolean;
    isProcessing: boolean;
    outcome: string[];
    terminalQueue: {
        length: number;
        shift: () => {text: string, toType: boolean} | undefined;
    };
}

interface GameActions {
    setUserNumbers: (numbers: number[]) => void;
    toggleAutoSpin: () => void;
    getCurrentNumbers: () => number[];
    handleInput: (input: string) => Promise<void>;
    setIsWin: (isWin: boolean) => void;
}

type DegenGambitContextType = [GameState, GameActions];

const DegenGambitContext = createContext<DegenGambitContextType | undefined>(undefined);

interface DegenGambitProviderProps {
    children: ReactNode;
}

export const DegenGambitProvider: React.FC<DegenGambitProviderProps> = ({ children }) => {
    const queryClient = useQueryClient();
    const { address: playerAddress } = useAccountToUse();
    const { triggerWinEffect } = useWinEffect();

    const [userNumbers, setUserNumbers] = useState<number[]>(numbers);
    const [autoSpin, setAutoSpin] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outcome, setOutcome] = useState<string[]>([]);

    const toggleAutoSpin = useCallback(() => {
        setAutoSpin(prev => !prev);
    }, []);

    const setIsWin = useCallback((isWin: boolean) => {
        if (isWin) {
            // Get the current outcome from the state
            triggerWinEffect(outcome);
        }
    }, [triggerWinEffect, outcome]);

    const getCurrentNumbers = useCallback(() => {
        return userNumbers;
    }, [userNumbers]);

    const gameParams: any = {
        onSetNumbers: setUserNumbers,
        getCurrentNumbers,
        onAutoSpinToggle: toggleAutoSpin,
        setIsWin,
        autoSpin,
    };

    const { handleInput: terminalHandleInput, outputQueue, setOutputQueue } = useTerminal(gameParams);

    const handleInput = async (input: string) => {
        if (input === 'clear') {
            setOutputQueue([]);
            return;
        }

        if (['spin', 'respin', 'spin boost'].includes(input)) {
            setIsSpinning(true);
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
                if (autoSpin && input.startsWith('spin')) {
                    setTimeout(() => {
                        const gambitBalance = queryClient.getQueryData(['accountGambitBalance', playerAddress]) as {value: bigint};
                        const isBoosted = gambitBalance && gambitBalance.value > BigInt(1);
                        handleInput('spin' + (isBoosted ? ' boost' : ''));
                    }, result.isPrize ? 22000 : 13000);
                }
                const outcomeValues = result.outcome.map(item => numbers[Number(item)].toString());
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
        } catch (error: any) {
            if (autoSpin && input.startsWith('spin')) {
                const gambitBalance = queryClient.getQueryData(['accountGambitBalance', playerAddress]) as {value: bigint};
                const isBoosted = gambitBalance && gambitBalance.value > BigInt(1);
                handleInput('spin' + (isBoosted ? ' boost' : ''));
            }
            const errorMessage = error.message ?? String(error);
            setOutputQueue(prev => [...prev, {text: errorMessage, toType: false}]);
        } finally {
            setIsSpinning(false);
            setIsProcessing(false);
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
        userNumbers,
        autoSpin,
        isSpinning,
        isProcessing,
        outcome,
        terminalQueue,
    };

    const gameActions: GameActions = {
        setUserNumbers,
        toggleAutoSpin,
        getCurrentNumbers,
        handleInput,
        setIsWin,
    };

    const contextValue: DegenGambitContextType = [gameState, gameActions];

    return (
        <DegenGambitContext.Provider value={contextValue}>
            {children}
        </DegenGambitContext.Provider>
    );
};

// Custom hook to use the degen gambit context
export const useDegenGambitContext = (): DegenGambitContextType => {
    const context = useContext(DegenGambitContext);
    if (context === undefined) {
        throw new Error('useDegenGambitContext must be used within a DegenGambitProvider');
    }
    return context;
};

// Export the context for direct usage if needed
export { DegenGambitContext };
