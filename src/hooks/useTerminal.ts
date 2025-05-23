// React and core imports
import { useEffect, useMemo, useState } from "react";

// Thirdweb imports
import { Chain, createThirdwebClient } from "thirdweb";
import { useActiveAccount, useActiveWallet, useConnectModal } from "thirdweb/react";

// Local imports
import { thirdwebClientId, thirdWebG7Testnet } from '../config';
import { CommandDispatcher } from '../commands/dispatcher';
import { degenGambitCommands, DegenGambitCommandParams, TerminalCommandParams } from '../commands/commands/degenGambit';
import { loggingMiddleware, errorHandlingMiddleware } from '../commands/middleware';

// Custom hooks
import { useAccountToUse } from './degen-gambit/useAccountToUse';

export const useTerminal = (gameParams: DegenGambitCommandParams) => {
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const { connect } = useConnectModal();
    const { displayName } = useAccountToUse();
    const client = createThirdwebClient({ clientId: thirdwebClientId });
    const [outputQueue, setOutputQueue] = useState<{text: string, toType: boolean}[]>([]);
    const [welcomeShown, setWelcomeShown] = useState(false);

    // Create and configure command dispatcher
    const dispatcher = useMemo(() => {
        const d = new CommandDispatcher<TerminalCommandParams>();
        degenGambitCommands.forEach(cmd => d.register(cmd));
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
            setOutputQueue(prev => [...prev, {text: `Wake up, ${displayName}`, toType: true}]);
            setWelcomeShown(true);
        }
    }, [activeWallet, connect, client, welcomeShown, displayName]);

    const handleInput = async (input: string) => {
        return dispatcher.dispatch(input, {
            activeAccount,
            client,
            gameParams,
        });
    }

    return {
        outputQueue,
        setOutputQueue,
        handleInput
    };
}; 