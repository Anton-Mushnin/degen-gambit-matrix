import { useState, useCallback } from 'react';
import { numbers } from '../config/symbols';

interface GameState {
    userNumbers: number[];
    isWin: boolean;
    autoSpin: boolean;
}

interface GameActions {
    setUserNumbers: (numbers: number[]) => void;
    setIsWin: (isWin: boolean) => void;
    toggleAutoSpin: () => void;
}

export const useDegenGambitGame = (): [GameState, GameActions] => {
    const [userNumbers, setUserNumbers] = useState<number[]>(numbers);
    const [isWin, setIsWin] = useState(false);
    const [autoSpin, setAutoSpin] = useState(false);

    const toggleAutoSpin = useCallback(() => {
        setAutoSpin(prev => !prev);
    }, []);

    const gameState: GameState = {
        userNumbers,
        isWin,
        autoSpin,
    };

    const gameActions: GameActions = {
        setUserNumbers,
        setIsWin,
        toggleAutoSpin,
    };

    return [gameState, gameActions];
}; 