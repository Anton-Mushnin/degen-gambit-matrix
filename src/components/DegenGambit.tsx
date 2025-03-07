import { MatrixTerminal } from "./MatrixTerminal";
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { contractAddress, thirdwebClientId, wagmiConfig } from '../config';
import { getStreaks, getBalances, spin, accept, respin, getBlockInfo } from "../utils/degenGambit";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { useState, useEffect, useRef, useCallback } from "react";
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
    const [blocksRemaining, setBlocksRemaining] = useState<number | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const blockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Track last spin deadline info
    const lastSpinInfoRef = useRef({
        lastSpinBlock: null as number | null,
        blockDeadline: null as number | null,
        blocksToAct: null as number | null
    });
    
    // Initial block info fetch when component mounts
    useEffect(() => {
        async function fetchInitialBlockInfo() {
            if (activeAccount) {
                const blockInfo = await getBlockInfo(contractAddress, activeAccount.address, true);
                console.log("Initial block info:", blockInfo);
            }
        }
        
        fetchInitialBlockInfo();
    }, [activeAccount]);
    
    const updateBlocksRemaining = useCallback(async () => {
        if (!activeAccount || !pendingOutcome) return;
        
        try {
            // Always force a refresh to ensure we get the latest data
            const blockInfo = await getBlockInfo(contractAddress, activeAccount.address, true);
            if (blockInfo) {
                // Make sure we log the data we're seeing
                console.log(`TIMER UPDATE: Current block=${blockInfo.currentBlock}, Deadline=${blockInfo.blockDeadline}, Remaining=${blockInfo.blocksRemaining}`);
                
                // Update state immediately with the calculated value
                setBlocksRemaining(Number(blockInfo.blocksRemaining));
                
                // Always update the spin info for reference
                lastSpinInfoRef.current = {
                    lastSpinBlock: Number(blockInfo.lastSpinBlock),
                    blockDeadline: Number(blockInfo.blockDeadline),
                    blocksToAct: Number(blockInfo.blocksToAct)
                };
                
                if (blockInfo.blocksRemaining <= 0) {
                    console.log("TIMER EXPIRED!");
                    setIsExpired(true);
                    
                    if (blockTimerRef.current) {
                        clearInterval(blockTimerRef.current);
                        blockTimerRef.current = null;
                    }
                    
                    setPendingOutcome(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            isExpired: true
                        };
                    });
                }
            } else {
                console.error("No block info returned, something went wrong");
            }
        } catch (error) {
            console.error("Failed to update block info:", error);
        }
    }, [activeAccount, pendingOutcome]);
    
    useEffect(() => {
        if (pendingOutcome && activeAccount && !isExpired) {
            console.log("Starting block countdown timer");
            updateBlocksRemaining();
            blockTimerRef.current = setInterval(updateBlocksRemaining, 15000);
            
            return () => {
                console.log("Stopping block countdown timer");
                if (blockTimerRef.current) {
                    clearInterval(blockTimerRef.current);
                    blockTimerRef.current = null;
                }
            };
        }
    }, [pendingOutcome, activeAccount, isExpired, updateBlocksRemaining]);
    
    const formatSpinOutput = (result: SpinResult, currentBlocksRemaining: number | null) => {
        const prize = Number(result.prize || 0);
        const prizeText = prize > 0 
            ? `Prize: ${result.prize} ${result.prizeType === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : 'GAMBIT'}`
            : '';
            
        // Make sure we always have a value - default to 0 if nothing else is available
        const displayBlocks = currentBlocksRemaining !== null ? currentBlocksRemaining : 
                             (result.blockInfo?.blocksRemaining !== undefined ? result.blockInfo.blocksRemaining : 0);
        const timerLine = `Time remaining: ${displayBlocks} blocks`;
        const actionText = `Type 'accept' to claim${prize > 0 ? ' prize' : ''} or 'respin' to try again (cost: ${result.costToRespin})`;
        
        // Ensure the result has the correct blockInfo structure before passing to formatSpinOutput
        const normalizedResult: SpinResult = {
            ...result,
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
                timerLine,
                actionText
            ].filter(Boolean) as string[], // Filter out empty lines and cast to string[]
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
                window.open("https://getsome.game7.io", "_blank");
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
                    // For a new spin, ensure we have a proper blocks remaining value
                    // The contract should provide blocksToAct as the initial time window
                    const initialBlocksRemaining = spinResult.blockInfo?.blocksToAct || 
                                            contractInfo?.data?.blocksToAct || 20; // fallback to 20 blocks
                    
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
                            blocksRemaining: Number(initialBlocksRemaining), // Use our calculated value
                            blocksToAct: Number(spinResult.blockInfo?.blocksToAct || 0)
                        },
                        costToRespin: spinResult.costToRespin || '0',
                        needsAcceptance: true,
                        isRespin: false
                    };
                    
                    // Update state with the new outcome
                    setPendingOutcome(outcome);
                    
                    // IMPORTANT: Always set a valid blocks remaining value after a spin
                    console.log(`Setting initial blocks remaining to: ${initialBlocksRemaining}`);
                    setBlocksRemaining(Number(initialBlocksRemaining));
                    setIsExpired(false); // Reset expired state with new outcome
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
                return formatSpinOutput(normalizedSpinResult, blocksRemaining);
            }
            case "accept": {
                if (!activeAccount || !activeWallet) {
                    return {output: ["No account selected"]};
                }
                
                // Check if there's a pending outcome to accept
                if (!pendingOutcome) {
                    return {output: ["Nothing to accept. Spin first!"]};
                }
                
                // Check if the outcome has expired - use both our dedicated isExpired state and the one in pendingOutcome
                if (isExpired || pendingOutcome.isExpired) {
                    // Clean up the expired state
                    setPendingOutcome(null);
                    setBlocksRemaining(null);
                    setIsExpired(false);
                    
                    // Reset local spin info reference
                    lastSpinInfoRef.current = {
                        lastSpinBlock: null as number | null,
                        blockDeadline: null as number | null,
                        blocksToAct: null as number | null
                    };
                    
                    if (blockTimerRef.current) {
                        clearInterval(blockTimerRef.current);
                        blockTimerRef.current = null;
                    }
                    
                    return {output: ["Time's up! The deadline to accept has passed. Please spin again."]};
                }
                
                // Execute the accept function
                const acceptResult = await accept(contractAddress, activeAccount, client);
                
                // Clear the pending outcome if acceptance was successful
                if (acceptResult.success) {
                    setPendingOutcome(null);
                    setBlocksRemaining(null);
                    setIsExpired(false);
                    
                    // Reset local spin info reference
                    lastSpinInfoRef.current = {
                        lastSpinBlock: null as number | null,
                        blockDeadline: null as number | null,
                        blocksToAct: null as number | null
                    };
                    
                    if (blockTimerRef.current) {
                        clearInterval(blockTimerRef.current);
                        blockTimerRef.current = null;
                    }
                    
                    const spinType = pendingOutcome.isRespin ? "RESPIN" : "SPIN";
                    
                    return {
                        output: [
                            `=== ${spinType} OUTCOME ACCEPTED ===`,
                            acceptResult.description,
                            "Transaction confirmed. Outcome settled successfully!",
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
            case "respin": {
                if (!activeAccount || !activeWallet) {
                    return {output: ["No account selected"]};
                }
                
                // Make sure there's a pending outcome
                if (!pendingOutcome) {
                    return {output: ["No pending spin to respin. Spin first!"]};
                }
                
                // Check if the outcome has expired - use both our dedicated isExpired state and the one in pendingOutcome
                if (isExpired || pendingOutcome.isExpired) {
                    // Clean up the expired state
                    setPendingOutcome(null);
                    setBlocksRemaining(null);
                    setIsExpired(false);
                    
                    // Reset local spin info reference
                    lastSpinInfoRef.current = {
                        lastSpinBlock: null as number | null,
                        blockDeadline: null as number | null,
                        blocksToAct: null as number | null
                    };
                    
                    if (blockTimerRef.current) {
                        clearInterval(blockTimerRef.current);
                        blockTimerRef.current = null;
                    }
                    
                    return {output: ["Time's up! The deadline to respin has passed. Please spin again."]};
                }
                
                // Execute the respin
                const respinResult = await respin(contractAddress, false, activeAccount, client);
                
                // Store the result in our consolidated outcome state
                if (respinResult.pendingAcceptance) {
                    // For a respin, ensure we have a proper blocks remaining value
                    // The contract should provide blocksToAct as the initial time window
                    const initialBlocksRemaining = respinResult.blockInfo?.blocksToAct || 
                                            contractInfo?.data?.blocksToAct || 20; // fallback to 20 blocks
                    
                    // Convert to our SpinOutcome type
                    const outcome: SpinOutcome = {
                        description: respinResult.description || '',
                        outcome: respinResult.outcome,
                        prize: respinResult.prize || '0',
                        prizeType: respinResult.prizeType || 0,
                        blockInfo: {
                            currentBlock: typeof respinResult.blockInfo?.currentBlock === 'bigint' 
                                ? respinResult.blockInfo.currentBlock 
                                : BigInt(respinResult.blockInfo?.currentBlock || 0),
                            blockDeadline: respinResult.blockInfo?.blockDeadline || 0,
                            blocksRemaining: Number(initialBlocksRemaining), // Use our calculated value
                            blocksToAct: Number(respinResult.blockInfo?.blocksToAct || 0)
                        },
                        costToRespin: respinResult.costToRespin || '0',
                        needsAcceptance: true,
                        isRespin: true // Mark as a respin
                    };
                    
                    // Update state with the new outcome
                    setPendingOutcome(outcome);
                    
                    // IMPORTANT: Always set a valid blocks remaining value after a respin
                    console.log(`Setting initial blocks remaining to: ${initialBlocksRemaining}`);
                    setBlocksRemaining(Number(initialBlocksRemaining));
                    setIsExpired(false); // Reset expired state with new outcome
                }
                
                // Format and return output - same logic for both spin and respin
                // For respins, prefix the description with "RESPIN: "
                const result = {...respinResult};
                if (result.description) {
                    result.description = "RESPIN: " + result.description;
                }
                
                // Create a normalized version of result that matches the SpinResult interface
                const normalizedResult: SpinResult = {
                    ...result,
                    blockInfo: result.blockInfo ? {
                        blocksRemaining: Number(result.blockInfo.blocksRemaining || 0),
                        currentBlock: typeof result.blockInfo.currentBlock === 'bigint' 
                            ? result.blockInfo.currentBlock 
                            : result.blockInfo.currentBlock !== undefined 
                                ? BigInt(result.blockInfo.currentBlock) 
                                : undefined,
                        blockDeadline: typeof result.blockInfo.blockDeadline === 'bigint'
                            ? result.blockInfo.blockDeadline
                            : result.blockInfo.blockDeadline !== undefined
                                ? Number(result.blockInfo.blockDeadline)
                                : undefined,
                        blocksToAct: typeof result.blockInfo.blocksToAct === 'number'
                            ? result.blockInfo.blocksToAct
                            : result.blockInfo.blocksToAct !== undefined
                                ? Number(result.blockInfo.blocksToAct)
                                : null,
                        lastSpinBlock: typeof result.blockInfo.lastSpinBlock === 'bigint'
                            ? result.blockInfo.lastSpinBlock
                            : result.blockInfo.lastSpinBlock !== undefined
                                ? Number(result.blockInfo.lastSpinBlock)
                                : undefined,
                        costToRespin: null
                    } : null
                };
                
                return formatSpinOutput(normalizedResult, blocksRemaining);
            }
            case "status": {
                if (pendingOutcome) {
                    // For status command, force a complete refresh including LastSpinBlock
                    const blockInfo = await getBlockInfo(contractAddress, activeAccount?.address || "", true);
                    if (blockInfo) {
                        setBlocksRemaining(Number(blockInfo.blocksRemaining));
                        
                        // Update our local reference
                        lastSpinInfoRef.current = {
                            lastSpinBlock: Number(blockInfo.lastSpinBlock),
                            blockDeadline: Number(blockInfo.blockDeadline),
                            blocksToAct: Number(blockInfo.blocksToAct)
                        };
                    }
                    
                    // Check if expired
                    if (isExpired || pendingOutcome.isExpired) {
                        return {
                            output: [
                                "=== EXPIRED OUTCOME ===",
                                pendingOutcome.description,
                                "The time to act on this outcome has expired.",
                                "Please spin again to continue playing.",
                                "======================"
                            ],
                            outcome: pendingOutcome.outcome?.slice(0, 3),
                        };
                    }
                    
                    // Active pending outcome
                    const spinType = pendingOutcome.isRespin ? "RESPIN" : "SPIN";
                    const statusPrize = Number(pendingOutcome.prize);
                    
                    // Just return simple status text directly without any fancy formatting
                    return {
                        output: [
                            `=== PENDING ${spinType} STATUS ===`,
                            pendingOutcome.description,
                            `Prize: ${pendingOutcome.prize} ${pendingOutcome.prizeType === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : 'GAMBIT'}`,
                            `Time remaining: ${blocksRemaining !== null ? blocksRemaining : 0} blocks`,
                            `Respin cost: ${pendingOutcome.costToRespin} ${wagmiConfig.chains[0].nativeCurrency.symbol}`,
                            `Block deadline: ${pendingOutcome.blockInfo?.blockDeadline} (current: ${pendingOutcome.blockInfo?.currentBlock})`,
                            "",
                            `Type 'accept' to claim${statusPrize > 0 ? ' prize' : ''} or 'respin' to try again`,
                            "==========================="
                        ],
                        outcome: pendingOutcome.outcome?.slice(0, 3),
                    };
                } else {
                    return {output: ["No pending outcome. Type 'spin' to play!"]};
                }
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
                    "  respin   - Respin with a discount (instead of accepting)",
                    "  status   - Check status of pending spin",
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