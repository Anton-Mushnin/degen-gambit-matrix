// React and core imports
import { useEffect, useMemo, useRef, useState } from "react";

// Local imports
import { CommandDispatcher } from '../commands/dispatcher';
import { CommandDefinition } from '../commands/types';
import { TerminalCommandParams } from '../games/degen-gambit/commands/degenGambit';
import { loggingMiddleware, errorHandlingMiddleware } from '../commands/middleware';
import { gameManagementCommands, GameManagementParams } from '../commands/commands/gameManagement';

// Custom hooks
import { useBlockchain } from './useBlockchain';
import { useDevMode } from '../contexts/DevModeContext';
import { getGameConfig, GameContractConfig } from '../utils/gameConfig';
import { useWinEffect } from "@/contexts/WinEffectContext";

const phrasesToType = ['Wake up', 'The Matrix', 'Prize'];


export const useTerminal = () => {
    const { activeAccount, client, publicClient, displayName, gameContext } = useBlockchain();
    const devModeContext = useDevMode();
    const [outputQueue, setOutputQueue] = useState<{text: string, toType: boolean}[]>([]);
    const [welcomeShown, setWelcomeShown] = useState(true);
    const { triggerWinEffect } = useWinEffect();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [outcome, setOutcome] = useState<string[]>([]);
    const autoSpinRef = useRef(false);

    // Create and configure command dispatcher
    const dispatcher = useMemo(() => {
        const d = new CommandDispatcher<TerminalCommandParams & GameManagementParams>();
        
        // Register global commands (game management)
        gameManagementCommands.forEach((cmd: CommandDefinition<GameManagementParams>) => {
            d.register(cmd as CommandDefinition<TerminalCommandParams & GameManagementParams>);
        });
        
        // Set up game context for the dispatcher
        d.setGameContext({
            activeGameId: gameContext.activeGame?.id || null,
            switchGameByName: gameContext.switchGameByName,
            getGameNames: gameContext.getGameNames,
            getGameCommands: gameContext.getGameCommands
        });

        // Add middleware
        d.use(loggingMiddleware);
        d.use(errorHandlingMiddleware);
        
        return d;
    }, [gameContext.activeGame?.id, gameContext.switchGameByName, gameContext.getGameNames, gameContext.getGameCommands]);

    // Update dispatcher when game context changes
    useEffect(() => {
        dispatcher.setGameContext({
            activeGameId: gameContext.activeGame?.id || null,
            switchGameByName: gameContext.switchGameByName,
            getGameNames: gameContext.getGameNames,
            getGameCommands: gameContext.getGameCommands
        });
    }, [dispatcher, gameContext.activeGame?.id, gameContext.switchGameByName, gameContext.getGameNames, gameContext.getGameCommands]);

    // Handle initial welcome message
    useEffect(() => {
        if (displayName && !welcomeShown) {
            setOutputQueue(prev => [...prev, 
                {text: `Wake up, ${displayName}`, toType: true},
            ]);
            setWelcomeShown(true);
        }
    }, [welcomeShown, displayName, gameContext.activeGame]);

    const handleInput = async (input: string) => {
        if (input === 'auto') {
            const oldAutoSpin = autoSpinRef.current;
            autoSpinRef.current = !oldAutoSpin;
            setOutputQueue(prev => [...prev, {text: `Auto spin: ${!oldAutoSpin}`, toType: false}]);
            return;
        }
        // Get contract configuration based on dev mode
        setIsProcessing(true);
        setIsBusy(true);
        let contractAddress = '';
        let contractABI = null;
        
        if (gameContext.activeGame?.config?.gameContractConfig) {
            const gameConfig = getGameConfig(
                gameContext.activeGame.config.gameContractConfig as GameContractConfig,
                devModeContext.isDevMode
            );
            contractAddress = gameConfig.contractAddress;
            contractABI = gameConfig.abi;
        } else {
            // Fallback to legacy config
            contractAddress = (gameContext.activeGame?.config?.contractAddress as string) || '';
        }

        // Prepare combined parameters for both game and management commands
        const combinedParams = {
            // Terminal command params
            activeAccount,
            client,
            publicClient,
            contractAddress,
            contractABI,
            // Game management params
            gameContext: {
                activeGameId: gameContext.activeGame?.id || null,
                switchGameByName: gameContext.switchGameByName,
                getGameNames: gameContext.getGameNames,
                getGameInfo: gameContext.getGameInfo,
                availableGames: gameContext.availableGames
            },
            // Dev mode params
            devModeContext
        };
        try {
            const result = await dispatcher.dispatch(input, combinedParams);
            if (result?.output && !result.outcome) {
                const outputText = result.output.join('\n');
                if (outputText) {
                    setOutputQueue(prev => [...prev, {text: outputText, toType: false}]);
                }
                return result;
            } else if (result?.outcome) {
                setOutcome(result.output || []);
                if (result.isPrize) {
                    setTimeout(() => {
                            triggerWinEffect(result.outcome);
                        }, 1000);
                }
                setTimeout(() => {
                    if (result.output) {
                        setOutputQueue(prev => [...prev, {text: result.output?.join(' ') || '', toType: false}]);
                    }
                    setOutputQueue(prev => [...prev, {
                        text: result.outcome?.join('\n') || '', 
                        toType: phrasesToType.some(str => (result.outcome?.join('\n') || '').startsWith(str))}]);
                    setIsBusy(false);
                    setOutcome([]);
                    setTimeout(() => {
                    if (autoSpinRef.current && result.autoCommand) {
                        setOutputQueue(prev => [...prev, {text: `Auto spin: ${result.autoCommand}`, toType: false}]);
                        handleInput(result.autoCommand);
                    }
                    }, 3000);
                }, result.isPrize ? 8000 : 3000);
            }
        } catch (error) {
            console.error('UseTerminal input error:', error);
            setOutputQueue(prev => [...prev, {text: 'Error processing command', toType: false}]);
        } finally {
            setIsProcessing(false);
            setIsBusy(false);
        }
    }

    const handleBreak = () => {
        setOutputQueue(prev => [...prev, {text: '^C', toType: false}, {text: 'Auto spin disabled', toType: false}]);
        autoSpinRef.current = false;
    }

    return {
        outputQueue,
        setOutputQueue,
        handleInput,
        currentGame: gameContext.activeGame,
        isProcessing,
        isBusy,
        outcome,
        handleBreak,
    };
}; 