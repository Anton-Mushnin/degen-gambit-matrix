import { WalletClient, PublicClient, Abi } from 'viem';
import { ThirdwebClient } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { viemAdapter } from 'thirdweb/adapters/viem';
import { sendTransaction, prepareContractCall } from 'thirdweb/transaction';
import { waitForReceipt } from 'thirdweb/transaction';
import { getViemChainById } from '../../../config/networks';
import { getBetAmount } from './read';
import { diceRunABI } from './DiceRun.abi';

export type DiceRunPlayResult = readonly [bigint, bigint, bigint]; // diceResult, payout, streakLength
export type DiceRunFundResult = readonly [bigint, bigint]; // netInvestment, sharesReceived
export type DiceRunWithdrawResult = readonly [bigint]; // withdrawnAmount

// Write functions for DiceRun contract

export const play = async (
    contractAddress: string,
    guess: number,
    account: Account | undefined,
    client: ThirdwebClient,
    publicClient: PublicClient
): Promise<DiceRunPlayResult> => {
    if (!account) {
        throw new Error("No account provided");
    }

    const betAmount = await getBetAmount(contractAddress, publicClient);
    const chainId = await publicClient.getChainId();
    const chain = getViemChainById(chainId);

    const contract = viemAdapter.contract.fromViem({
        viemContract: {
            address: contractAddress,
            abi: diceRunABI as Abi,
        },
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
        contract: contract as any,
        method: "play" as any,
        params: [guess],
        value: betAmount.value,
    });

    const transactionResult = await sendTransaction({
        transaction: tx,
        account,
    });

    const receipt = await waitForReceipt(transactionResult);

    // Read the result from the transaction logs or return values
    // For now, we'll assume the contract emits events or we need to decode return values
    // Since the function returns values, we might need to simulate the call or handle differently
    // For immediate results, let's simulate the call to get return values
    const result = await publicClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi: diceRunABI,
        functionName: 'play',
        args: [guess],
        value: betAmount.value,
        account: account.address,
    });

    return result.result as DiceRunPlayResult;
};

export const fund = async (
    contractAddress: string,
    investmentAmount: bigint,
    account: Account | undefined,
    client: ThirdwebClient,
    publicClient: PublicClient
): Promise<DiceRunFundResult> => {
    if (!account) {
        throw new Error("No account provided");
    }

    const chainId = await publicClient.getChainId();
    const chain = getViemChainById(chainId);

    const contract = viemAdapter.contract.fromViem({
        viemContract: {
            address: contractAddress,
            abi: diceRunABI as Abi,
        },
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

    // Execute the fund transaction
    const tx = prepareContractCall({
        contract: contract as any,
        method: "fund" as any,
        params: [],
        value: investmentAmount,
    });

    const transactionResult = await sendTransaction({
        transaction: tx,
        account,
    });

    const receipt = await waitForReceipt(transactionResult);

    // Simulate to get return values
    const result = await publicClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi: diceRunABI,
        functionName: 'fund',
        args: [],
        value: investmentAmount,
        account: account.address,
    });

    return result.result as DiceRunFundResult;
};

export const withdraw = async (
    contractAddress: string,
    withdrawalAmount: bigint,
    account: Account | undefined,
    client: ThirdwebClient,
    publicClient: PublicClient
): Promise<DiceRunWithdrawResult> => {
    if (!account) {
        throw new Error("No account provided");
    }

    const chainId = await publicClient.getChainId();
    const chain = getViemChainById(chainId);

    const contract = viemAdapter.contract.fromViem({
        viemContract: {
            address: contractAddress,
            abi: diceRunABI as Abi,
        },
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

    // Execute the withdraw transaction
    const tx = prepareContractCall({
        contract: contract as any,
        method: "withdraw" as any,
        params: [withdrawalAmount],
    });

    const transactionResult = await sendTransaction({
        transaction: tx,
        account,
    });

    const receipt = await waitForReceipt(transactionResult);

    // Simulate to get return values
    const result = await publicClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi: diceRunABI,
        functionName: 'withdraw',
        args: [withdrawalAmount],
        account: account.address,
    });

    return result.result as DiceRunWithdrawResult;
};
