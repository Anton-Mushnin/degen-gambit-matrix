import { PublicClient } from 'viem';
import { Account } from 'thirdweb/wallets';
import { ThirdwebClient } from 'thirdweb';
import { viemAdapter } from 'thirdweb/adapters/viem';
import { getViemChainById } from '../config/networks.ts';
import { sendTransaction, prepareContractCall } from 'thirdweb/transaction';
import { waitForReceipt } from 'thirdweb/transaction';
import { checkAndCreateBlockIfNeeded } from './blockProducer.ts';

export interface CommitRevealAcceptConfig {
  contractAddress: string;
  contractABI: readonly any[];
  commitFunctionName: string;
  commitArgs: any[];
  value?: bigint;
  account: Account | undefined;
  client: ThirdwebClient;
  publicClient: PublicClient;
  chainId: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface CommitRevealAcceptResult<T = [bigint, `0x${string}`]> {
  description: string;
  outcome: T;
  receipt: string | null;
  prize?: string;
  prizeType?: number;
}


export async function commitRevealAccept<T = [bigint, `0x${string}`]>(
  config: CommitRevealAcceptConfig
): Promise<CommitRevealAcceptResult<T>> {
  const {
    contractAddress,
    contractABI,
    commitFunctionName,
    commitArgs,
    value = BigInt(0),
    account,
    client,
    publicClient,
    chainId,
    maxRetries = 30,
    retryDelay = 1000
  } = config;

  if (!account) {
    throw new Error("No account provided");
  }

  const viemContract = {
    address: contractAddress,
    abi: contractABI,
  } as const;

  const degenAddress = account.address ?? "";

  const chain = getViemChainById(chainId);

  // COMMIT PHASE: Execute the spin transaction using ThirdwebClient
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

  // Execute the spin
  const tx = prepareContractCall({
    contract,
    method: commitFunctionName as any,
    params: commitArgs,
    value,
  });

  const transactionResult = await sendTransaction({
    transaction: tx,
    account,
  });

  const receipt = await waitForReceipt(transactionResult);
  const hash = receipt.transactionHash;

  // REVEAL PHASE: Wait for outcome to be available
  let outcome: T | null = null;
  let retries = 0;
  console.log("Waiting for outcome...");
  while (!outcome) {
    try {
      // Check if we need to create a new block before checking outcome
      const blockCheck = await checkAndCreateBlockIfNeeded(1, chainId, publicClient);
      if (blockCheck.created) {
        console.log("Created a new block to help with outcome processing:", blockCheck.message);
      } else if (blockCheck.timeDiff !== undefined && blockCheck.timeDiff > 3) {
        console.log(`Latest block is ${blockCheck.timeDiff}s old, but no new block was created: ${blockCheck.message}`);
      }
      
      outcome = await publicClient.readContract({
        ...viemContract,
        functionName: "inspectOutcome",
        args: [degenAddress],
      }) as T;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Known errors that can occur while waiting for the outcome to be available
      const knownErrors = ['WaitForTick()', 'InvalidBlockNumber', '0xd5dc642d', "Reveal block not yet mined", "No commit to reveal"];
      
      if (!knownErrors.some(err => errorMsg.includes(err))) {
        console.error("Unknown error while checking outcome:", errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log(`Waiting for outcome, retry ${retries + 1}/${maxRetries}...`);
      retries += 1;
      
      if (retries > maxRetries) {
        throw new Error("Timeout waiting for outcome. Please try again.");
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  console.log("outcome", outcome);
  const [prizeValue, _] = outcome as readonly [bigint, `0x${string}`];
  if (Number(prizeValue) > 0) {
    console.log('accepting', prizeValue);
    const tx = prepareContractCall({
      contract,
      method: 'accept',
      params: [],
    });
    const transactionResult = sendTransaction({
      transaction: tx,
      account,
    });
    console.log('accepted', transactionResult);
  }

  return {
    description: "Spin completed successfully",
    outcome,
    receipt: hash,
  };
}
