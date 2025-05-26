import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccountToUse } from '../degen-gambit/useAccountToUse';
import { useRpsTerminal } from '../useRpsTerminal';
import { Move } from '../../utils/rpsGame';
import { RockPaperScissorsCommandParams } from '../../commands/commands/rpsGame';
import { getActiveGame, getGame } from '../../utils/rpsGame';
import { contractAddress } from '../../config';

interface GameState {
    currentGameId: number | null;
    playerRole: 'player1' | 'player2' | null;
    betAmount: bigint | null;
    player1Move: Move;
    player2Move: Move;
    gameState: 'waiting' | 'committed' | 'revealed' | 'finished' | 'cancelled' | 'timeout';
    isProcessing: boolean;
    outcome: 'player1' | 'player2' | 'draw' | null;
    terminalQueue: {
        length: number;
        shift: () => {text: string, toType: boolean} | undefined;
    };
}

interface GameActions {
    setCurrentGameId: (gameId: number | null) => void;
    setPlayerRole: (role: 'player1' | 'player2' | null) => void;
    setBetAmount: (amount: bigint | null) => void;
    setPlayer1Move: (move: Move) => void;
    setPlayer2Move: (move: Move) => void;
    setGameState: (state: GameState['gameState']) => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setOutcome: (outcome: GameState['outcome']) => void;
    handleInput: (input: string) => Promise<void>;
}

export const useRockPaperScissorsGame = (): [GameState, GameActions] => {
    const queryClient = useQueryClient();
    const { address: playerAddress } = useAccountToUse();
    
    // Game state
    // const [currentGameId, setCurrentGameId] = useState<number | null>(null);
    const [playerRole, setPlayerRole] = useState<'player1' | 'player2' | null>(null);
    const [betAmount, setBetAmount] = useState<bigint | null>(null);
    const [player1Move, setPlayer1Move] = useState<Move>(Move.None);
    const [player2Move, setPlayer2Move] = useState<Move>(Move.None);
    const [gameState, setGameState] = useState<GameState['gameState']>('waiting');
    const [isProcessing, setIsProcessing] = useState(false);
    const [outcome, setOutcome] = useState<GameState['outcome']>(null);

    const { handleInput: terminalHandleInput, outputQueue, setOutputQueue, setCurrentGameId, currentGameId } = useRpsTerminal();

    useEffect(() => {
        console.log('playerAddress', playerAddress);
    }, [playerAddress]);

    // Check for active game when component mounts or player address changes
    useEffect(() => {
        const checkActiveGame = async () => {
            console.log('checkActiveGame', playerAddress);
            if (!playerAddress) return;

            try {
                const activeGameResult = await getActiveGame(contractAddress, playerAddress);
                console.log('activeGameResult', activeGameResult);
                
                if (activeGameResult.success && activeGameResult.gameId && activeGameResult.gameId !== 0) {
                    setCurrentGameId(activeGameResult.gameId);
                    
                    // Fetch game details
                    const gameInfo = await getGame(contractAddress, activeGameResult.gameId);
                    if (gameInfo) {
                        // Set player role
                        if (gameInfo.player1.toLowerCase() === playerAddress.toLowerCase()) {
                            setPlayerRole('player1');
                        } else if (gameInfo.player2.toLowerCase() === playerAddress.toLowerCase()) {
                            setPlayerRole('player2');
                        }
                        
                        // Set other game state
                        setBetAmount(gameInfo.betAmount);
                        setPlayer1Move(gameInfo.player1Move);
                        setPlayer2Move(gameInfo.player2Move);
                        
                        // Set game state based on contract state
                        switch (gameInfo.state) {
                            case 0: // WaitingForPlayer2
                                setGameState('waiting');
                                break;
                            case 1: // WaitingForPlayer1Move
                                setGameState('waiting');
                                break;
                            case 2: // WaitingForPlayer2Move
                                setGameState('waiting');
                                break;
                            case 3: // Committed
                                setGameState('committed');
                                break;
                            case 4: // Revealed
                                setGameState('revealed');
                                break;
                            case 5: // Finished
                                setGameState('finished');
                                break;
                            case 6: // Cancelled
                                setGameState('cancelled');
                                break;
                            case 7: // Player1Timeout
                                setGameState('timeout');
                                break;
                        }
                    }
                } else {
                    // Reset game state if no active game
                    setCurrentGameId(null);
                    setPlayerRole(null);
                    setBetAmount(null);
                    setPlayer1Move(Move.None);
                    setPlayer2Move(Move.None);
                    setGameState('waiting');
                    setOutcome(null);
                }
            } catch (error) {
                console.error('Error checking active game:', error);
            }
        };

        checkActiveGame();
    }, [playerAddress]);

    const handleInput = async (input: string) => {
        console.log('handleInput', input);
        if (input === 'clear') {
            setOutputQueue([]);
            return;
        }

        setIsProcessing(true);
        
        try {
            const result = await terminalHandleInput(input);
            console.log(result);
            if (result?.output) {
                const outputText = result.output.join('\n');
                if (outputText) { 
                    setOutputQueue(prev => [...prev, {text: outputText, toType: false}]);
                }
            }
        } catch (error: any) {
            const errorMessage = error.message ?? String(error);
            setOutputQueue(prev => [...prev, {text: errorMessage, toType: false}]);
        } finally {
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

    const gameStateObj: GameState = {
        currentGameId,
        playerRole,
        betAmount,
        player1Move,
        player2Move,
        gameState,
        isProcessing,
        outcome,
        terminalQueue,
    };

    const gameActions: GameActions = {
        setCurrentGameId,
        setPlayerRole,
        setBetAmount,
        setPlayer1Move,
        setPlayer2Move,
        setGameState,
        setIsProcessing,
        setOutcome,
        handleInput,
    };

    return [gameStateObj, gameActions];
}; 