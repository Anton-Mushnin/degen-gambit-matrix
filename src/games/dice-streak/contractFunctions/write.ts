import { WalletClient, PublicClient } from 'viem';
import { ThirdwebClient } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { viemAdapter } from 'thirdweb/adapters/viem';
import { sendTransaction, prepareContractCall } from 'thirdweb/transaction';
import { waitForReceipt } from 'thirdweb/transaction';
import { getViemChainById } from '../../../config/networks';
import { getBetAmount } from './read';
import { commitRevealSpin } from '../../../utils/commitRevealSpin';

// Define DiceStreak ABI for write functions
const diceStreakABI = [
  {
    "inputs": [{"internalType": "uint8", "name": "guess", "type": "uint8"}],
    "name": "play",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "accept",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

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

// Write functions for DiceStreak contract

export const play = async (contractAddress: string, guess: number, client: WalletClient | ThirdwebClient, publicClient: PublicClient, account?: Account) => {
  const betAmount = await getBetAmount(contractAddress, publicClient);

  if ('writeContract' in client) {
    // WalletClient
    const walletAccount = client.account;
    if (!walletAccount) {
      throw new Error("No account provided");
    }

    return client.writeContract({
      account: walletAccount,
      address: contractAddress,
      abi: diceStreakABI,
      functionName: 'play',
      args: [guess],
      value: betAmount.value,
      chain: null,
    });
  } else if (account) {
    // ThirdwebClient
    const viemContract = {
      address: contractAddress,
      abi: diceStreakABI,
    } as const;

    const chainId = await publicClient.getChainId();
    const chain = getViemChainById(chainId);

    const contract = viemAdapter.contract.fromViem({
      viemContract: viemContract,
      chain: {
        ...chain,
        rpc: chain.rpcUrls["default"].http[0],
        blockExplorers: [{
          name: chain.blockExplorers?.default.name ?? "",
          url: chain.blockExplorers?.default.url ?? ""
        }],
        testnet: true
      },
      client,
    });

    // Execute the play transaction
    const tx = prepareContractCall({
      contract,
      method: "play",
      params: [guess],
      value: betAmount.value,
    });

    const transactionResult = await sendTransaction({
      transaction: tx,
      account,
    });

    const receipt = await waitForReceipt(transactionResult);
    return receipt.transactionHash;
  } else {
    throw new Error("No account provided for ThirdwebClient");
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

