import { type PublicClient } from 'viem';

// Blockchain data getters for Even-Odd game
// Note: These functions use viem's built-in blockchain methods, no custom ABI needed

// Getter for Pot Balance (blockchain - contract balance)
export async function getPotBalance(
  publicClient: PublicClient,
  contractAddress: string
): Promise<bigint> {
  return await publicClient.getBalance({ address: contractAddress as `0x${string}` });
}

// Getter for Current Block (blockchain - current block number)
export async function getCurrentBlock(publicClient: PublicClient): Promise<number> {
  const blockNumber = await publicClient.getBlockNumber();
  return Number(blockNumber);
}

// Getter for Player Balance (blockchain - native token balance)
export async function getPlayerBalance(
  publicClient: PublicClient,
  playerAddress: string
): Promise<bigint> {
  return await publicClient.getBalance({ address: playerAddress as `0x${string}` });
}

// Getter for block timestamp
export async function getBlockTimestamp(
  publicClient: PublicClient,
  blockNumber?: bigint
): Promise<number> {
  const block = await publicClient.getBlock({ 
    blockNumber: blockNumber 
  });
  return Number(block?.timestamp || 0);
}

// Getter for block hash
export async function getBlockHash(
  publicClient: PublicClient,
  blockNumber: bigint
): Promise<string> {
  const block = await publicClient.getBlock({ blockNumber });
  return block?.hash || '';
} 