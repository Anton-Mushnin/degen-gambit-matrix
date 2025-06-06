import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyAddress } from '../../config';

interface UseAccountToUseResult {
  displayName: string;
  address: string | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to get the current account address and resolve its ENS name
 * @returns The display name (ENS or shortened address), raw address, loading state and error
 */
export function useAccountToUse(): UseAccountToUseResult {
  const activeAccount = useActiveAccount();
  const [displayName, setDisplayName] = useState<string>('');
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const resolveAccount = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const addressToUse = privateKeyAddress || activeAccount?.address;
        setAddress(addressToUse);
        
        if (!addressToUse) {
          setDisplayName('');
          return;
        }
        
        // Default to shortened address format
        let resolvedName = addressToUse.slice(0, 6) + '...' + addressToUse.slice(-4);
        
        try {
          // Try to resolve ENS name
          const publicClient = createPublicClient({
            chain: mainnet,
            transport: http()
          });
          
          const ensName = await publicClient.getEnsName({
            address: addressToUse as `0x${string}`
          });
          
          if (ensName) {
            resolvedName = ensName;
          }
        } catch (ensError) {
          console.error("Error resolving ENS:", ensError);
          // We still have the shortened address as fallback
        }
        
        setDisplayName(resolvedName);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    resolveAccount();
  }, [activeAccount]);

  return { displayName, address, isLoading, error };
} 