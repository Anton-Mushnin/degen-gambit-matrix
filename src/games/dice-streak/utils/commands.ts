import { Account } from 'thirdweb/wallets';
import { ThirdwebClient } from 'thirdweb';
import { PublicClient } from 'viem';
import { commitRevealSpin } from '../../../utils/commitRevealSpin';
import { diceStreakABI } from '../../../ABIs/DiceStreak.abi';


export type DiceStreakPlayResult = {
  description: string;
  guess: number;
  receipt?: string | null;
};

export type DiceStreakAcceptResult = {
  description: string;
  success: boolean;
  receipt?: string | null;
  error?: string;
};

/**
 * Play function for DiceStreak - commit and reveal phases
 * Calls play(uint8 guess) and handles randomness reveal
 */
export const play = async (
  contractAddress: string,
  guess: number,
  account: Account | undefined,
  client: ThirdwebClient,
  publicClient: PublicClient
): Promise<DiceStreakPlayResult> => {
  if (!account) {
    throw new Error("No account provided");
  }

  try {
    const chainId = await publicClient.getChainId();

    // Get the bet amount
    const viemContract = {
      address: contractAddress,
      abi: diceStreakABI,
    } as const;

    const betAmount = await publicClient.readContract({
      ...viemContract,
      functionName: 'betAmount',
    });

    // Use commitRevealSpin for both commit and reveal phases
    const result = await commitRevealSpin({
      contractAddress,
      contractABI: diceStreakABI,
      spinFunctionName: 'play',
      spinArgs: [guess],
      value: betAmount,
      account,
      client,
      publicClient,
      chainId,
    });

    return {
      description: `Bet committed for guess ${guess}. Results revealed.`,
      guess,
      receipt: result.receipt,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to play and reveal: ${errorMessage}`);
  }
};

/**
 * Accept function for DiceStreak - reveals and processes results
 * Uses commitRevealSpin to properly handle the reveal phase
 */
export const accept = async (
  contractAddress: string,
  account: Account | undefined,
  client: ThirdwebClient,
  publicClient: PublicClient
): Promise<DiceStreakAcceptResult> => {
  if (!account) {
    throw new Error("No account provided");
  }

  try {
    const chainId = await publicClient.getChainId();

    // Use commitRevealSpin for the accept function (reveal phase)
    const result = await commitRevealSpin({
      contractAddress,
      contractABI: diceStreakABI,
      spinFunctionName: 'accept',
      spinArgs: [],
      value: BigInt(0), // accept doesn't require payment
      account,
      client,
      publicClient,
      chainId,
    });

    return {
      description: "Results revealed and processed successfully.",
      success: true,
      receipt: result.receipt,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      description: `Failed to accept results: ${errorMessage}`,
      success: false,
      error: errorMessage,
    };
  }
};
