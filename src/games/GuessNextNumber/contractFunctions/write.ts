import { PublicClient, Abi } from 'viem';
import { ThirdwebClient } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { viemAdapter } from 'thirdweb/adapters/viem';
import { sendTransaction, prepareContractCall } from 'thirdweb/transaction';
import { waitForReceipt } from 'thirdweb/transaction';
import { getViemChainById } from '../../../config/networks';
import { guessNextNumberABI } from './GuessNextNumber.abi';
import { getPlayerShare } from './read';

export type DepositResult = {
    receipt: string;
    sharePercent: string;
};

export type WithdrawResult = {
    receipt: string;
};

export const deposit = async (
    contractAddress: string,
    amount: bigint,
    account: Account | undefined,
    client: ThirdwebClient,
    publicClient: PublicClient
): Promise<DepositResult> => {
    if (!account) {
        throw new Error("No account provided");
    }

    const chainId = await publicClient.getChainId();
    const chain = getViemChainById(chainId);

    const contract = viemAdapter.contract.fromViem({
        viemContract: {
            address: contractAddress,
            abi: guessNextNumberABI as Abi,
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

    const tx = prepareContractCall({
        contract: contract as any,
        method: "deposit" as any,
        params: [],
        value: amount,
    });

    const transactionResult = await sendTransaction({
        transaction: tx,
        account,
    });

    const receipt = await waitForReceipt(transactionResult);

    // Get updated share percentage
    const share = await getPlayerShare(contractAddress, account.address, publicClient);

    return {
        receipt: receipt.transactionHash,
        sharePercent: share.formatted.replace('%', '')
    };
};

export const withdraw = async (
    contractAddress: string,
    amount: bigint,
    account: Account | undefined,
    client: ThirdwebClient,
    publicClient: PublicClient
): Promise<WithdrawResult> => {
    if (!account) {
        throw new Error("No account provided");
    }

    const chainId = await publicClient.getChainId();
    const chain = getViemChainById(chainId);

    const contract = viemAdapter.contract.fromViem({
        viemContract: {
            address: contractAddress,
            abi: guessNextNumberABI as Abi,
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

    const tx = prepareContractCall({
        contract: contract as any,
        method: "withdraw" as any,
        params: [amount],
    });

    const transactionResult = await sendTransaction({
        transaction: tx,
        account,
    });

    const receipt = await waitForReceipt(transactionResult);

    return {
        receipt: receipt.transactionHash,
    };
};

