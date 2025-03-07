import { MatrixTerminal } from "./MatrixTerminal";
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { contractAddress, thirdwebClientId, wagmiConfig } from '../config';
import { getStreaks, getBalances, spin, accept, respin, getBlockInfo } from "../utils/degenGambit";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { useState, useEffect, useRef } from "react";
import { numbers } from "../config/symbols";

// Helper type for spin/respin results
interface SpinResult {
    description?: string;
    outcome?: bigint[];
    prize?: string;
    prizeType?: number;
    blockInfo?: {
        blocksRemaining: number;
    };
    costToRespin?: string;
    pendingAcceptance?: boolean;
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
        outcome?: bigint[];            // The actual symbols rolled
        prize: string;                 // Prize amount
        prizeType: number;             // Type of prize (1=native token, 20=GAMBIT)
        blockInfo: {                   // Block timing information
            currentBlock: bigint;         
            blockDeadline: bigint;
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
    const blockTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [lastCommandResult, setLastCommandResult] = useState<any>(null);
    const updateBlocksRemaining = async () => {
        if (!activeAccount || !pendingOutcome) return;
        
        try {
            const blockInfo = await getBlockInfo(contractAddress, activeAccount.address);
            if (blockInfo) {
                console.log(`UPDATING TIMER: ${blockInfo.blocksRemaining} blocks remaining`);
                setBlocksRemaining(blockInfo.blocksRemaining);
                
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
            }
        } catch (error) {
            console.error("Failed to update block info:", error);
        }
    };
    
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
    }, [pendingOutcome, activeAccount, isExpired]);
    
    const formatSpinOutput = (result: SpinResult, currentBlocksRemaining: number | null) => {
        const prize = Number(result.prize || 0);
        const prizeText = prize > 0 
            ? `Prize: ${result.prize} ${result.prizeType === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : 'GAMBIT'}`
            : '';
            
        const timerLine = `Time remaining: ${currentBlocksRemaining !== null ? currentBlocksRemaining : result.blockInfo?.blocksRemaining || '?'} blocks`;
        const actionText = `Type 'accept' to claim${prize > 0 ? ' prize' : ''} or 'respin' to try again (cost: ${result.costToRespin})`;
        
        return {
            output: [
                result.description,
                prizeText,
                timerLine,
                actionText
            ].filter(line => line), // Filter out empty lines
            outcome: result.outcome?.slice(0, 3),
        };
    };

    const handleInput = async (input: string) => {
        switch (input) {
            case "info":
                return {output: [
                    `Cost to spin: ${contractInfo.data?.costToSpin}`,
                    `Cost to respin: ${contractInfo.data?.costToRespin}`,
                    `Blocks to act: ${contractInfo.data?.blocksToAct} (~${contractInfo.data?.secondsToAct} seconds)`,
                ],
            };
            case "prizes":
                return {output: contractInfo.data?.prizes};
            case "getsome": 
                window.open("https://getsome.game7.io", "_blank");
                return {output: []};
            case "streaks":
                const streaks = await getStreaks(contractAddress, activeAccount?.address ?? "");
                return {output: [
                    `Daily streak: ${streaks.dailyStreak}`,
                    `Weekly streak: ${streaks.weeklyStreak}`,
                ],
                };
            case "balance":
                const balances = await getBalances(contractAddress, activeAccount?.address ?? "");
                return {output: [
                    `Native token balance: ${balances.nativeBalance} ${wagmiConfig.chains[0].nativeCurrency.symbol}`,
                    `Gambit token balance: ${balances.balance} ${balances.symbol}`,
                ],
                };
            case "spin":
                if (!activeAccount || !activeWallet) {
                    return {output: ["No account selected"]};
                }
                
                // Execute the spin
                const spinResult = await spin(contractAddress, false, activeAccount, client);
                
                // Store the result in our consolidated outcome state
                if (spinResult.pendingAcceptance) {
                    // Convert to our SpinOutcome type
                    const outcome: SpinOutcome = {
                        description: spinResult.description,
                        outcome: spinResult.outcome,
                        prize: spinResult.prize || '0',
                        prizeType: spinResult.prizeType || 0,
                        blockInfo: spinResult.blockInfo || {
                            currentBlock: BigInt(0),
                            blockDeadline: BigInt(0),
                            blocksRemaining: 0,
                            blocksToAct: 0
                        },
                        costToRespin: spinResult.costToRespin || '0',
                        needsAcceptance: true,
                        isRespin: false
                    };
                    
                    // Update state with the new outcome
                    setPendingOutcome(outcome);
                    
                    // Also update the blocks remaining separately 
                    if (spinResult.blockInfo) {
                        setBlocksRemaining(spinResult.blockInfo.blocksRemaining);
                        setIsExpired(false); // Reset expired state with new outcome
                    }
                }
                
                
                // Format and return output - same logic for both spin and respin
                return formatSpinOutput(spinResult, blocksRemaining);
            case "accept":
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
                    ].filter(line => line),
                };
            case "respin":
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
                    // Convert to our SpinOutcome type
                    const outcome: SpinOutcome = {
                        description: respinResult.description,
                        outcome: respinResult.outcome,
                        prize: respinResult.prize || '0',
                        prizeType: respinResult.prizeType || 0,
                        blockInfo: respinResult.blockInfo || {
                            currentBlock: BigInt(0),
                            blockDeadline: BigInt(0),
                            blocksRemaining: 0,
                            blocksToAct: 0
                        },
                        costToRespin: respinResult.costToRespin || '0',
                        needsAcceptance: true,
                        isRespin: true // Mark as a respin
                    };
                    
                    // Update state with the new outcome
                    setPendingOutcome(outcome);
                    
                    // Also update the blocks remaining separately 
                    if (respinResult.blockInfo) {
                        setBlocksRemaining(respinResult.blockInfo.blocksRemaining);
                        setIsExpired(false); // Reset expired state with new outcome
                    }
                }
                
                
                // Format and return output - same logic for both spin and respin
                // For respins, prefix the description with "RESPIN: "
                const result = {...respinResult};
                if (result.description) {
                    result.description = "RESPIN: " + result.description;
                }
                return formatSpinOutput(result, blocksRemaining);
            case "status":
                if (pendingOutcome) {
                    // Update the blocks remaining - but only once when status is requested
                    await updateBlocksRemaining();
                    
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
                            `Time remaining: ${blocksRemaining !== null ? blocksRemaining : pendingOutcome.blockInfo?.blocksRemaining || '?'} blocks`,
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
            case "symbols": 
                return {output: ["Minor symbols:", userNumbers.slice(1, 16).join(', '), "Major symbols:", userNumbers.slice(-3).join(', ')]};
            case input.match(/^set \d+ \d+$/)?.input: {
                const [_, indexStr, numberStr] = input.split(' ');
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
            default:
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