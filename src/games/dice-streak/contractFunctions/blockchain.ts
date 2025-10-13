import { PublicClient } from 'viem';
import { getBalance } from '@wagmi/core';
import { wagmiConfig } from '../../../config/index';

// Blockchain utility functions for DiceStreak

export const getContractBalance = async (contractAddress: string, _publicClient: PublicClient) => {
  try {
    const balance = await getBalance(wagmiConfig, {address: contractAddress});
    return {
      value: balance.value,
      formatted: `${balance.formatted} ETH`,
      decimals: 18
    };
  } catch (error) {
    throw new Error(`Failed to get contract balance: ${error}`);
  }
};
