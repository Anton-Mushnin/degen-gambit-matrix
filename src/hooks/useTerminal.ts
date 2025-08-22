// React and core imports
import { useEffect, useMemo, useState } from "react";

// Thirdweb imports
import { Chain, createThirdwebClient } from "thirdweb";
import { useActiveAccount, useActiveWallet, useConnectModal } from "thirdweb/react";

// Local imports
import { thirdwebClientId, thirdWebG7Testnet } from '../config';
import { CommandDispatcher } from '../commands/dispatcher';
import { CommandDefinition } from '../commands/types';
import { DegenGambitCommandParams, TerminalCommandParams } from '../games/degen-gambit/commands/degenGambit';
import { loggingMiddleware, errorHandlingMiddleware } from '../commands/middleware';
import { gameManagementCommands, GameManagementParams } from '../commands/commands/gameManagement';
import { useGameContext } from '../contexts/GameContext';

// Custom hooks
import { useAccountToUse } from '../games/degen-gambit/hooks/useAccountToUse';

export const useTerminal = (gameParams: DegenGambitCommandParams) => {
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const { connect } = useConnectModal();
    const { displayName } = useAccountToUse();
    const client = createThirdwebClient({ clientId: thirdwebClientId });
    const [outputQueue, setOutputQueue] = useState<{text: string, toType: boolean}[]>([]);
    const [welcomeShown, setWelcomeShown] = useState(false);

    // Get game context for command routing
    const gameContext = useGameContext();

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
            const currentGame = gameContext.activeGame;
            const gameInfo = currentGame ? ` - ${currentGame.name}` : '';
            setOutputQueue(prev => [...prev, 
                {text: `Wake up, ${displayName}${gameInfo}`, toType: true},
                {text: 'Type "help" for available commands', toType: true}
            ]);
            setWelcomeShown(true);
        }
    }, [activeWallet, connect, client, welcomeShown, displayName, gameContext.activeGame]);

    // Show game switch notification
    useEffect(() => {
        if (welcomeShown && gameContext.activeGame) {
            const game = gameContext.activeGame;
            setOutputQueue(prev => [...prev, {
                text: `[SYSTEM] Active game: ${game.name} - Type "help" to see commands`, 
                toType: false
            }]);
        }
    }, [gameContext.activeGame?.id, welcomeShown]);

    const handleInput = async (input: string) => {
        // Prepare combined parameters for both game and management commands
        const combinedParams = {
            // Terminal command params
            activeAccount,
            client,
            gameParams,
            // Game management params
            gameContext: {
                activeGameId: gameContext.activeGame?.id || null,
                switchGameByName: gameContext.switchGameByName,
                getGameNames: gameContext.getGameNames,
                getGameInfo: gameContext.getGameInfo,
                availableGames: gameContext.availableGames
            }
        };

        return dispatcher.dispatch(input, combinedParams);
    }

    return {
        outputQueue,
        setOutputQueue,
        handleInput,
        currentGame: gameContext.activeGame
    };
}; 