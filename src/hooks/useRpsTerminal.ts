// React and core imports
import { useEffect, useMemo, useState } from "react";

// Thirdweb imports
import { Chain, createThirdwebClient } from "thirdweb";
import { useActiveAccount, useActiveWallet, useConnectModal } from "thirdweb/react";

// Local imports
import { thirdwebClientId, thirdWebG7Testnet, contractAddress } from '../config';
import { CommandDispatcher } from '../commands/dispatcher';
import { rpsGameCommands, RPSGameCommandParams, TerminalCommandParams } from '../commands/commands/rpsGame';
import { loggingMiddleware, errorHandlingMiddleware } from '../commands/middleware';
import { GameState, getGame } from '../utils/rpsGame';

// Custom hooks
import { useAccountToUse } from './degen-gambit/useAccountToUse';

export const useRpsTerminal = () => {
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const { connect } = useConnectModal();
    const { displayName } = useAccountToUse();
    const client = createThirdwebClient({ clientId: thirdwebClientId });
    const [outputQueue, setOutputQueue] = useState<{text: string, toType: boolean}[]>([]);
    const [welcomeShown, setWelcomeShown] = useState(false);
    const [currentGameId, setCurrentGameId] = useState<number | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);

    // Create and configure command dispatcher
    const dispatcher = useMemo(() => {
        const d = new CommandDispatcher<TerminalCommandParams>();
        rpsGameCommands.forEach(cmd => d.register(cmd));
        d.use(loggingMiddleware);
        d.use(errorHandlingMiddleware);
        return d;
    }, []);


    // Handle wallet connection and chain switching
    useEffect(() => {
        if (activeWallet) {
            const chain = activeWallet.getChain();
            if (chain?.id !== thirdWebG7Testnet.id) {
                activeWallet.switchChain(thirdWebG7Testnet as Chain);
            }
        }
    }, [activeWallet]);

    // Handle initial connection and welcome message
    useEffect(() => {
        if (!activeWallet) {
            connect({client});
        }
        if (displayName && !welcomeShown) {
            setOutputQueue(prev => [...prev, {text: `Welcome to RPS Game, ${displayName}`, toType: true}]);
            setWelcomeShown(true);
        }
    }, [activeWallet, connect, client, welcomeShown, displayName]);

    // Game state polling
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        console.log('currentGameId', currentGameId);
        const pollGameState = async () => {
            console.log('polling game state');
            if (currentGameId !== null) {
                const gameInfo = await getGame(contractAddress, currentGameId);
                if (gameInfo) {
                    setGameState(gameInfo.state);
                    
                    // Add game state updates to output queue
                    if (gameInfo.state !== gameState) {
                        const stateMessages = {
                            [GameState.WaitingForPlayer2]: "Waiting for Player 2 to join...",
                            [GameState.WaitingForPlayer1Move]: "Waiting for Player 1 to make a move...",
                            [GameState.WaitingForPlayer2Move]: "Waiting for Player 2 to make a move...",
                            [GameState.Committed]: "Player 1 has committed their move. Waiting for Player 2...",
                            [GameState.Revealed]: "Player 1 has revealed their move. Game is finished!",
                            [GameState.Finished]: "Game is finished!",
                            [GameState.Cancelled]: "Game has been cancelled.",
                            [GameState.Player1Timeout]: "Player 1 has timed out."
                        };

                        setOutputQueue(prev => [...prev, {text: stateMessages[gameInfo.state], toType: true}]);
                    }
                }
            }
        };

        if (currentGameId !== null) {
            pollGameState();
            intervalId = setInterval(pollGameState, 5000); // Poll every 5 seconds
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [currentGameId, gameState]);

    const handleInput = async (input: string) => {
        const result = await dispatcher.dispatch(input, {
            activeAccount,
            client,
            gameParams: {
                getCurrentGameId: () => currentGameId,
                setCurrentGameId: (gameId: number | null) => {
                    setCurrentGameId(gameId);
                    if (gameId === null) {
                        setGameState(null);
                    }
                },
                onGameUpdate: (gameInfo: any) => {
                    setGameState(gameInfo.state);
                }
            }
        });

        // // Handle command output
        // if (result?.output) {
        //     console.log('result.output', result);
        //     const outputText = result.output.join('\n');
        //     if (outputText) {
        //         setOutputQueue(prev => [...prev, {text: outputText, toType: false}]);
        //     }
        // }

        return result;
    }

    return {
        outputQueue,
        setOutputQueue,
        handleInput,
        currentGameId,
        setCurrentGameId,
        gameState
    };
}; 