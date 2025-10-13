import { createPublicClient, http, PublicClient } from 'viem';
import { NETWORKS } from '../config/networks';

export const createPublicClientForNetwork = (networkId: number): PublicClient => {
    // Find the network by ID
    const networkKey = Object.keys(NETWORKS).find(key => 
        NETWORKS[key as keyof typeof NETWORKS].id === networkId
    ) as keyof typeof NETWORKS;
    
    if (!networkKey) {
        throw new Error(`Network with ID ${networkId} not found`);
    }
    
    const network = NETWORKS[networkKey];
    
    return createPublicClient({
        chain: network,
        transport: http(),
    });
};
