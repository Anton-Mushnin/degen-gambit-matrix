import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { useTerminal } from '../../../hooks/useTerminal';
import { useWinEffect } from '../../../contexts/WinEffectContext';
import { decodeAbiParameters } from "viem";
import { wagmiConfig } from "../../../config";
import { diceStreakGame } from "..";
import { formatEtherOrWei } from "../utils";




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
                setIsProcessing(false);
                setIsBusy(false);
                return;
            }
            const rollOutcome = result.outcome as readonly [bigint, `0x${string}`];
            const prizeValue = rollOutcome[0];
            const isPrize = prizeValue > 0;
            const additionalData = rollOutcome[1];
            console.log("!!!!!!!DiceStreakContext result", result)
            
            // Decode the uint32 result from bytes
            const [decodedResult] = decodeAbiParameters([{ type: 'uint32' }], additionalData);
            const diceResult = Number(decodedResult);

            console.log("!!!!!!!DiceStreakContext result", result)

            if (autoSpin && input.startsWith('play')) {
                setTimeout(() => {
                    handleInput('play 1');
                }, isPrize ? 22000 : 13000);
            }
            setOutcome([diceResult.toString()]);
            if (isPrize) {
                setTimeout(() => {
                        setIsWin(true, result.outcome);
                    }, 1000);
            }
            
            setTimeout(() => {
                let actionText = '';
                setOutputQueue(prev => [...prev, {text: [diceResult.toString(), isPrize ? 'Win' : 'Loss'].join(' '), toType: false}]);
                if (isPrize) {
                    const gameChain = wagmiConfig.chains.find(chain => chain.id === diceStreakGame.network.id) || wagmiConfig.chains[0]
                    actionText = `You rolled ${diceResult}! You won ${formatEtherOrWei(prizeValue, gameChain.nativeCurrency.decimals ?? 18).formatted} ${gameChain.nativeCurrency.symbol}`;
                } else {
                    actionText = `The Matrix has you...`;
                }
                setOutputQueue(prev => [...prev, {text: actionText, toType: phrasesToType.some(str => actionText.startsWith(str))}]);
                // }
                setOutcome([]);
            }, isPrize ? 8000 : 1000);
            
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
