import { createPublicClient, http } from 'viem';
import { wagmiConfig } from '../config';

/**
 * Checks if the chain needs a new block and creates one if needed
 * @param maxAgeSeconds Maximum age of the latest block in seconds
 * @returns Object with status and message
 */
export async function checkAndCreateBlockIfNeeded(maxAgeSeconds = 5): Promise<{ 
  created: boolean; 
  message: string;
  latestBlockTimestamp?: number;
  currentTime?: number;
  timeDiff?: number;
}> {
  // Create a public client to read blockchain data
  const publicClient = createPublicClient({
    chain: wagmiConfig.chains[0],
    transport: http()
  });

  try {
    // Get the latest block
    const latestBlock = await publicClient.getBlock();
    const latestBlockTimestamp = Number(latestBlock.timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = currentTime - latestBlockTimestamp;

    // If the latest block is recent enough, no need to create a new one
    if (timeDiff <= maxAgeSeconds) {
      return { 
        created: false, 
        message: "Latest block is recent enough", 
        latestBlockTimestamp,
        currentTime,
        timeDiff
      };
    }

    // Request a new block from the API
    try {
      const response = await fetch('/api/blockProducer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxAgeSeconds
        })
      });

      if (!response.ok) {
        return {
          created: false,
          message: `API error: ${response.status} ${response.statusText}`,
          latestBlockTimestamp,
          currentTime,
          timeDiff
        };
      }

      const data = await response.json();
      return {
        created: data.created,
        message: data.message,
        latestBlockTimestamp,
        currentTime,
        timeDiff,
        ...data // Include any additional data from the API
      };
    } catch (error) {
      return {
        created: false,
        message: `Error connecting to block producer API: ${error instanceof Error ? error.message : String(error)}`,
        latestBlockTimestamp,
        currentTime,
        timeDiff
      };
    }
  } catch (error) {
    console.error("Error checking block:", error);
    return { 
      created: false, 
      message: `Error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
} 