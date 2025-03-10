import { MatrixTerminal } from "./MatrixTerminal";
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { contractAddress, thirdwebClientId, wagmiConfig } from '../config';
import { getStreaks, getBalances, spin, accept } from "../utils/degenGambit";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { useState } from "react";
import { numbers } from "../config/symbols";

// Helper type for spin/respin results
interface SpinResult {
    description?: string;
    outcome?: readonly bigint[] | bigint[];
    prize?: string;
    prizeType?: number;
    blockInfo?: {
        blocksRemaining: number;
        currentBlock?: bigint;
        blockDeadline?: bigint | number;
        blocksToAct?: number | null;
        lastSpinBlock?: bigint | number;
        costToRespin?: null;
    } | null;
    costToRespin?: string;
    pendingAcceptance?: boolean;
    actionNeeded?: string;
    receipt?: Record<string, unknown>;
    success?: boolean;
    error?: string;
}

const DegenGambit = () => {
    const contractInfo = useDegenGambitInfo(contractAddress);
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const client = createThirdwebClient({ clientId: thirdwebClientId });
    const [userNumbers, setUserNumbers] = useState<number[]>(numbers);
    // Define a structured type for spin outcome
    interface SpinOutcome {
        description: string;           // Description of the outcome
        outcome?: readonly bigint[] | bigint[];            // The actual symbols rolled
        prize: string;                 // Prize amount
        prizeType: number;             // Type of prize (1=native token, 20=GAMBIT)
        blockInfo: {                   // Block timing information
            currentBlock: bigint;         
            blockDeadline: bigint | number;
            blocksRemaining: number;
            blocksToAct: number;
        };
        costToRespin: string;          // Cost to respin (different from initial spin)
        needsAcceptance: boolean;      // Whether this outcome needs explicit acceptance
        isRespin?: boolean;            // Whether this was a respin
        isExpired?: boolean;           // Whether the time to act has expired
    }

    // Single consolidated state for any pending outcome (initial spin or respin)
    const [pendingOutcome, setPendingOutcome] = useState<SpinOutcome | null>(null);
    
    const formatSpinOutput = (result: SpinResult) => {
        const prize = Number(result.prize || 0);
        const prizeText = prize > 0 
            ? `Prize: ${result.prize} ${result.prizeType === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : 'GAMBIT'}`
            : '';
            
        const actionText = prize > 0 ? `Type 'accept' to claim prize` : '';
        const description = prize > 0 ? '' : result.description;
        
        const normalizedResult: SpinResult = {
            ...result,
            description,
            blockInfo: result.blockInfo ? {
                blocksRemaining: result.blockInfo.blocksRemaining,
                currentBlock: typeof result.blockInfo.currentBlock === 'bigint' 
                    ? result.blockInfo.currentBlock 
                    : result.blockInfo.currentBlock !== undefined 
                        ? BigInt(result.blockInfo.currentBlock) 
                        : undefined,
                blockDeadline: result.blockInfo.blockDeadline,
                blocksToAct: result.blockInfo.blocksToAct,
                lastSpinBlock: result.blockInfo.lastSpinBlock,
                costToRespin: result.blockInfo.costToRespin
            } : undefined
        };
        
        return {
            output: [
                normalizedResult.description,
                prizeText,
                actionText
            ].filter(Boolean) as string[],
            outcome: normalizedResult.outcome ? [...normalizedResult.outcome].slice(0, 3) : undefined,
        };
    };

    const handleInput = async (input: string): Promise<{output: string[], outcome?: bigint[]}> => {
        switch (input) {
            case "info": {
                return {output: [
                    `Cost to spin: ${contractInfo.data?.costToSpin}`,
                    `Cost to respin: ${contractInfo.data?.costToRespin}`,
                    `Blocks to act: ${contractInfo.data?.blocksToAct} (~${contractInfo.data?.secondsToAct} seconds)`,
                ],
                };
            }
            case "prizes": {
                return {output: contractInfo.data?.prizes || []};
            }
            case "getsome": {
                window.open(`https://getsome.game7.io?network=testnet&address=${activeAccount?.address}`, "_blank");
                return {output: []};
            }
            case "streaks": {
                const streaks = await getStreaks(contractAddress, activeAccount?.address ?? "");
                return {output: [
                    `Daily streak: ${streaks.dailyStreak}`,
                    `Weekly streak: ${streaks.weeklyStreak}`,
                ],
                };
            }
            case "balance": {
                const balances = await getBalances(contractAddress, activeAccount?.address ?? "");
                return {output: [
                    `Native token balance: ${balances.nativeBalance} ${wagmiConfig.chains[0].nativeCurrency.symbol}`,
                    `Gambit token balance: ${balances.balance} ${balances.symbol}`,
                ],
                };
            }
            case "spin": {
                if (!activeAccount || !activeWallet) {
                    return {output: ["No account selected"]};
                }
                
                // Execute the spin
                const spinResult = await spin(contractAddress, false, activeAccount, client);
                
                // Store the result in our consolidated outcome state
                if (spinResult.pendingAcceptance) {
                    // Convert to our SpinOutcome type
                    const outcome: SpinOutcome = {
                        description: spinResult.description || '',
                        outcome: spinResult.outcome,
                        prize: spinResult.prize || '0',
                        prizeType: spinResult.prizeType || 0,
                        blockInfo: {
                            currentBlock: typeof spinResult.blockInfo?.currentBlock === 'bigint' 
                                ? spinResult.blockInfo.currentBlock 
                                : BigInt(spinResult.blockInfo?.currentBlock || 0),
                            blockDeadline: spinResult.blockInfo?.blockDeadline || 0,
                            blocksRemaining: Number(spinResult.blockInfo?.blocksRemaining || 0),
                            blocksToAct: Number(spinResult.blockInfo?.blocksToAct || 0)
                        },
                        costToRespin: spinResult.costToRespin || '0',
                        needsAcceptance: true,
                        isRespin: false
                    };
                    
                    // Update state with the new outcome
                    setPendingOutcome(outcome);
                }
                
                // Create a normalized version of spinResult that matches the SpinResult interface
                const normalizedSpinResult: SpinResult = {
                    ...spinResult,
                    blockInfo: spinResult.blockInfo ? {
                        blocksRemaining: Number(spinResult.blockInfo.blocksRemaining || 0),
                        currentBlock: typeof spinResult.blockInfo.currentBlock === 'bigint' 
                            ? spinResult.blockInfo.currentBlock 
                            : spinResult.blockInfo.currentBlock !== undefined 
                                ? BigInt(spinResult.blockInfo.currentBlock) 
                                : undefined,
                        blockDeadline: typeof spinResult.blockInfo.blockDeadline === 'bigint'
                            ? spinResult.blockInfo.blockDeadline
                            : spinResult.blockInfo.blockDeadline !== undefined
                                ? Number(spinResult.blockInfo.blockDeadline)
                                : undefined,
                        blocksToAct: typeof spinResult.blockInfo.blocksToAct === 'number'
                            ? spinResult.blockInfo.blocksToAct
                            : spinResult.blockInfo.blocksToAct !== undefined
                                ? Number(spinResult.blockInfo.blocksToAct)
                                : null,
                        lastSpinBlock: typeof spinResult.blockInfo.lastSpinBlock === 'bigint'
                            ? spinResult.blockInfo.lastSpinBlock
                            : spinResult.blockInfo.lastSpinBlock !== undefined
                                ? Number(spinResult.blockInfo.lastSpinBlock)
                                : undefined,
                        costToRespin: null
                    } : null
                };
                
                // Format and return output - same logic for both spin and respin
                return formatSpinOutput(normalizedSpinResult);
            }
            case "accept": {
                if (!activeAccount || !activeWallet) {
                    return {output: ["No account selected"]};
                }
                
                // Check if there's a pending outcome to accept
                if (!pendingOutcome) {
                    return {output: ["Nothing to accept. Spin first!"]};
                }
                
                // Check if the outcome has expired
                if (pendingOutcome.isExpired) {
                    // Clean up the expired state
                    setPendingOutcome(null);
                    
                    return {output: ["Time's up! The deadline to accept has passed. Please spin again."]};
                }
                
                // Execute the accept function
                const acceptResult = await accept(contractAddress, activeAccount, client);
                
                // Clear the pending outcome if acceptance was successful
                if (acceptResult.success) {
                    setPendingOutcome(null);
                    
                    const spinType = pendingOutcome.isRespin ? "RESPIN" : "SPIN";
                    
                    return {
                        output: [
                            `=== ${spinType} OUTCOME ACCEPTED ===`,
                            acceptResult.description,
                            "Transaction confirmed.",
                            "======================",
                        ],
                    };
                }
                
                return {
                    output: [
                        "=== ACCEPTANCE FAILED ===",
                        acceptResult.description,
                        acceptResult.error ? `Error: ${acceptResult.error}` : '',
                        "======================"
                    ].filter(Boolean) as string[],
                };
            }
            case "symbols": {
                return {output: ["Minor symbols:", userNumbers.slice(1, 16).join(', '), "Major symbols:", userNumbers.slice(-3).join(', ')]};
            }
            case input.match(/^set \d+ \d+$/)?.input: {
                const [, indexStr, numberStr] = input.split(' ');
                const index = parseInt(indexStr);
                const number = parseInt(numberStr);
                
                if (index < 0 || index >= userNumbers.length) {
                    return {output: [`Invalid index. Must be between 0 and ${userNumbers.length - 1}`]};
                }
                
                const newNumbers = [...userNumbers];
                newNumbers[index] = number;
                setUserNumbers(newNumbers);
                return {output: ["Minor symbols:", newNumbers.slice(1, 16).join(', '), "Major symbols:", newNumbers.slice(-3).join(', ')]};
            }
            default: {
                return {output: [
                    "=== DEGEN GAMBIT COMMANDS ===",
                    "Game Flow:",
                    "  spin     - Spin the wheel",
                    "  accept   - Accept the current spin outcome (claim prize)",
                    "",
                    "Information:",
                    "  balance  - Check your native and gambit token balances",
                    "  info     - Show game parameters and costs",
                    "  prizes   - Display current prize pool",
                    "  streaks  - View your daily and weekly streaks",
                    "  symbols  - Display minor and major symbols",
                    "",
                    "Other:",
                    "  getsome  - Visit getsome.game7.io to get some tokens",
                    "  set      - Set symbol at index (set <1-based index> <number>)",
                    "  clear    - Clear the terminal (⌘K or Ctrl+K)",
                    "=============================",
                ],
                };
            }
        }
    }

    // Simple clean UI
    return (
        <div>
            <MatrixTerminal 
                onUserInput={handleInput} 
                numbers={userNumbers}
            />
        </div>
    )
}

export default DegenGambit;