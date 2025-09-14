// React and core imports
import { useEffect } from "react";

// Thirdweb imports
import { Chain, createThirdwebClient } from "thirdweb";
import { useActiveAccount, useActiveWallet, useConnectModal } from "thirdweb/react";

// Local imports
import { thirdwebClientId } from '../config';
import { getThirdWebNetwork, NETWORKS } from '../config/networks';
import { useAccountToUse } from './useAccountToUse';
import { useGameContext } from '../contexts/GameContext';
import { createPublicClientForNetwork } from '../utils/publicClient';

export const useBlockchain = () => {
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const { connect } = useConnectModal();
    const { displayName } = useAccountToUse();
    const client = createThirdwebClient({ clientId: thirdwebClientId });
    const gameContext = useGameContext();

    // Handle wallet connection
    useEffect(() => {
        if (!activeWallet) {
            connect({client});
        }
    }, [activeWallet, connect, client]);

    // Handle chain switching
    useEffect(() => {
        if (activeWallet && gameContext.activeGame) {
            const chain = activeWallet.getChain();
            console.log('chain', chain);
            if (chain?.id !== gameContext.activeGame.network.id) {
                // Find network key by matching chain ID
                const networkKey = Object.keys(NETWORKS).find(key => 
                    NETWORKS[key as keyof typeof NETWORKS].id === gameContext.activeGame?.network.id
                ) as keyof typeof NETWORKS;
                
                if (networkKey) {
                    const thirdwebChain = getThirdWebNetwork(networkKey);
                    activeWallet.switchChain(thirdwebChain as Chain);
                }
            }
        }
    }, [activeWallet, gameContext.activeGame]);

    // Create public client for the active game's network
    const publicClient = gameContext.activeGame 
        ? createPublicClientForNetwork(gameContext.activeGame.network.id)
        : null;

    return {
        activeAccount,
        activeWallet,
        client,
        publicClient,
        displayName,
        gameContext
    };
};
