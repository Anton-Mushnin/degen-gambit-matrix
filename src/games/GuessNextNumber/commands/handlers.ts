import { parseEther, formatEther, decodeAbiParameters } from 'viem';
import { TerminalCommandParams } from "../../../utils/gameHandlers";
import { commitRevealAccept } from "../../../utils/commitRevealAccept";
import { getCostOfPlay } from "../contractFunctions/read";
import { deposit, withdraw } from '../contractFunctions/write';

function parseAmountWithUnit(amountStr: string): { amount: bigint; unit: string } | null {
    const match = amountStr.match(/^(\d+\.?\d*)(ETH|WEI)$/i);
    if (!match) return null;
    
    const [, value, unit] = match;
    const unitUpper = unit.toUpperCase();
    
    try {
        const amount = unitUpper === 'ETH' 
            ? parseEther(value) 
            : BigInt(value);
        return { amount, unit: unitUpper };
    } catch {
        return null;
    }
}

export async function handleGuess({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { contractAddress, contractABI, publicClient, activeAccount, client } = params;

    try {
        // Parse guess from input (format: "guess 3")
        const match = input.match(/^guess (\d)$/);
        if (!match) {
            return { output: ["Invalid format. Use: guess <number> (1-6)"] };
        }

        const guess = parseInt(match[1]);
        if (guess < 1 || guess > 6) {
            return { output: ["Guess must be between 1 and 6"] };
        }

        if (!publicClient) {
            throw new Error("Public client not available");
        }

        const costOfPlay = await getCostOfPlay(contractAddress as `0x${string}`, publicClient);
        const chainId = await publicClient.getChainId();

        const result = await commitRevealAccept({
            contractAddress,
            contractABI: contractABI,
            commitFunctionName: 'guess',
            commitArgs: [guess],
            value: costOfPlay.value,
            account: activeAccount,
            client,
            publicClient,
            chainId,
        });

        // Decode result: [payout, resultBytes]
        const rollOutcome = result.outcome as readonly [bigint, `0x${string}`];
        const [payout, resultBytes] = rollOutcome;
        
        // Decode the uint32 result from dynamic bytes
        // The bytes contain abi.encode(uint32) which is 32 bytes padded
        const [decodedResult] = decodeAbiParameters([{ type: 'uint32' }], resultBytes as `0x${string}`);
        const actualNumber = Number(decodedResult);
        const isWin = payout > 0n;

        if (isWin) {
            return {
                output: [`Guess: ${guess}, Result: ${actualNumber}`],
                outcome: [`YOU WIN! Payout: ${formatEther(payout)} ETH`],
                isPrize: true
            };
        } else {
            return {
                output: [`Guess: ${guess}, Result: ${actualNumber}`],
                outcome: [`The Matrix has you...`],
                isPrize: false
            };
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [errorMessage] };
    }
}

export async function handleDeposit({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { activeAccount, client, publicClient, contractAddress } = params;

    if (!client || !publicClient) {
        return { output: ["No account selected or public client not available"] };
    }

    try {
        const match = input.match(/^deposit (.+)$/);
        if (!match) {
            return { output: ["Invalid format. Use: deposit <amount><unit> (e.g. 0.1ETH or 1000WEI)"] };
        }

        const parsed = parseAmountWithUnit(match[1].trim());
        if (!parsed) {
            return { output: ["Invalid format. Use: deposit <amount><unit> (e.g. 0.1ETH or 1000WEI)"] };
        }

        const { amount, unit } = parsed;

        if (amount <= 0n) {
            return { output: ["Amount must be greater than 0"] };
        }

        const result = await deposit(contractAddress, amount, activeAccount, client, publicClient);
        const displayAmount = unit === 'WEI' ? `${amount} WEI` : `${formatEther(amount)} ETH`;
        
        return {
            output: [
                `Deposited ${displayAmount} to bank`,
                `Your share: ${result.sharePercent}%`,
                `Transaction: ${result.receipt}`
            ]
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to deposit: ${errorMessage}`] };
    }
}

export async function handleWithdraw({ input, params }: { input: string; params: TerminalCommandParams }) {
    const { activeAccount, client, publicClient, contractAddress } = params;

    if (!client || !publicClient) {
        return { output: ["No account selected or public client not available"] };
    }

    try {
        const match = input.match(/^withdraw (.+)$/);
        if (!match) {
            return { output: ["Invalid format. Use: withdraw <amount><unit> (e.g. 0.1ETH or 1000WEI)"] };
        }

        const parsed = parseAmountWithUnit(match[1].trim());
        if (!parsed) {
            return { output: ["Invalid format. Use: withdraw <amount><unit> (e.g. 0.1ETH or 1000WEI)"] };
        }

        const { amount, unit } = parsed;

        if (amount <= 0n) {
            return { output: ["Amount must be greater than 0"] };
        }

        const result = await withdraw(contractAddress, amount, activeAccount, client, publicClient);
        const displayAmount = unit === 'WEI' ? `${amount} WEI` : `${formatEther(amount)} ETH`;
        
        return {
            output: [
                `Withdrew ${displayAmount} from bank`,
                `Transaction: ${result.receipt}`
            ]
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { output: [`Failed to withdraw: ${errorMessage}`] };
    }
}

