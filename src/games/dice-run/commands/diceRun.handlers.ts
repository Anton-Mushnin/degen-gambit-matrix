import { TerminalCommandParams } from '../../../utils/gameHandlers';
import { play, fund, withdraw } from '../contractFunctions/write';
import { parsePlayInput, parseFundInput, parseWithdrawInput, decodePlayResult, formatPlayOutcome, formatFundOutcome, formatWithdrawOutcome } from './diceRun.helpers';

export async function handlePlay({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { contractAddress, activeAccount, client, publicClient } = params;

    try {
        const guess = parsePlayInput(input);

        if (!publicClient) {
            throw new Error("Public client not available");
        }

        if (!activeAccount) {
            throw new Error("No account selected");
        }

        const result = await play(contractAddress, guess, activeAccount, client, publicClient);
        const { diceResult, won, payout, streakLength } = decodePlayResult(result);
        const chainId = await publicClient.getChainId();
        const formatted = formatPlayOutcome(diceResult, won, payout, streakLength, chainId);

        return {
            ...formatted,
            isPrize: won,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [errorMessage] };
    }
}

export async function handleFund({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { contractAddress, activeAccount, client, publicClient } = params;

    try {
        const investmentAmount = parseFundInput(input);

        if (!publicClient) {
            throw new Error("Public client not available");
        }

        if (!activeAccount) {
            throw new Error("No account selected");
        }

        const result = await fund(contractAddress, investmentAmount, activeAccount, client, publicClient);
        const [netInvestment, sharesReceived] = result;
        const chainId = await publicClient.getChainId();
        const formatted = formatFundOutcome(netInvestment, sharesReceived, chainId);

        return {
            ...formatted,
            isPrize: false,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to fund bank: ${errorMessage}`] };
    }
}

export async function handleWithdraw({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { contractAddress, activeAccount, client, publicClient } = params;

    try {
        const withdrawalAmount = parseWithdrawInput(input);

        if (!publicClient) {
            throw new Error("Public client not available");
        }

        if (!activeAccount) {
            throw new Error("No account selected");
        }

        const result = await withdraw(contractAddress, withdrawalAmount, activeAccount, client, publicClient);
        const [withdrawnAmount] = result;
        const chainId = await publicClient.getChainId();
        const formatted = formatWithdrawOutcome(withdrawnAmount, chainId);

        return {
            ...formatted,
            isPrize: false,
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to withdraw from bank: ${errorMessage}`] };
    }
}
