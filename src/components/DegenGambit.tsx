import { MatrixTerminal } from "./MatrixTerminal";
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { contractAddress, thirdwebClientId, wagmiConfig } from '../config';
import { getStreaks, getBalances, spin, accept, respin, getBlockInfo } from "../utils/degenGambit";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { useState, useEffect, useRef } from "react";
import { numbers } from "../config/symbols";

const DegenGambit = () => {
    const contractInfo = useDegenGambitInfo(contractAddress);
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const client = createThirdwebClient({ clientId: thirdwebClientId });
    const [userNumbers, setUserNumbers] = useState<number[]>(numbers);
    const [pendingSpinResult, setPendingSpinResult] = useState<any>(null);
    const [blocksRemaining, setBlocksRemaining] = useState<number | null>(null);
    const blockTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Function to update blocks remaining
    const updateBlocksRemaining = async () => {
        if (!activeAccount || !pendingSpinResult) return;
        
        try {
            const blockInfo = await getBlockInfo(contractAddress, activeAccount.address);
            if (blockInfo) {
                setBlocksRemaining(blockInfo.blocksRemaining);
                
                // If no blocks remaining, clear pending spin result
                if (blockInfo.blocksRemaining <= 0) {
                    setPendingSpinResult(null);
                    if (blockTimerRef.current) {
                        clearInterval(blockTimerRef.current);
                        blockTimerRef.current = null;
                    }
                }
            }
        } catch (error) {
            console.error("Failed to update blocks remaining:", error);
        }
    };
    
    // Setup interval to check blocks remaining when there's a pending spin
    useEffect(() => {
        if (pendingSpinResult && activeAccount) {
            // Update immediately
            updateBlocksRemaining();
            
            // Then set up interval (every 5 seconds)
            blockTimerRef.current = setInterval(updateBlocksRemaining, 5000);
            
            // Clean up on unmount
            return () => {
                if (blockTimerRef.current) {
                    clearInterval(blockTimerRef.current);
                    blockTimerRef.current = null;
                }
            };
        }
    }, [pendingSpinResult, activeAccount]);

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
                
                const spinResult = await spin(contractAddress, false, activeAccount, client);
                
                // Store the spin result for later reference
                if (spinResult.pendingAcceptance) {
                    setPendingSpinResult(spinResult);
                    setBlocksRemaining(spinResult.blockInfo?.blocksRemaining || null);
                }
                
                // Extract prize information for better display
                const prize = Number(spinResult.prize);
                const prizeText = prize > 0 
                    ? `Prize: ${spinResult.prize} ${spinResult.prizeType === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : 'GAMBIT'}`
                    : '';
                    
                const timerLine = spinResult.blockInfo 
                    ? `⏱️ Time remaining: ${blocksRemaining || spinResult.blockInfo.blocksRemaining || '?'} blocks`
                    : '';
                
                const actionText = `Type 'accept' to claim${prize > 0 ? ' prize' : ''} or 'respin' to try again (cost: ${spinResult.costToRespin})`;
                
                return {
                    output: [
                        spinResult.description,
                        prizeText,
                        timerLine,
                        actionText
                    ].filter(line => line), // Filter out empty lines
                    outcome: spinResult.outcome?.slice(0, 3),
                };
            case "accept":
                if (!activeAccount || !activeWallet) {
                    return {output: ["No account selected"]};
                }
                
                const acceptResult = await accept(contractAddress, activeAccount, client);
                
                // Clear the pending spin result if acceptance was successful
                if (acceptResult.success) {
                    setPendingSpinResult(null);
                    setBlocksRemaining(null);
                    
                    if (blockTimerRef.current) {
                        clearInterval(blockTimerRef.current);
                        blockTimerRef.current = null;
                    }
                    
                    return {
                        output: [
                            "=== OUTCOME ACCEPTED ===",
                            acceptResult.description,
                            "Transaction confirmed. Spin settled successfully!",
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
                
                // Make sure there's a pending spin
                if (!pendingSpinResult) {
                    return {output: ["No pending spin to respin. Spin first!"]};
                }
                
                const respinResult = await respin(contractAddress, false, activeAccount, client);
                
                // Update the pending result
                if (respinResult.pendingAcceptance) {
                    setPendingSpinResult(respinResult);
                    setBlocksRemaining(respinResult.blockInfo?.blocksRemaining || null);
                }
                
                // Extract prize information for better display
                const respinPrize = Number(respinResult.prize);
                const respinPrizeText = respinPrize > 0 
                    ? `Prize: ${respinResult.prize} ${respinResult.prizeType === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : 'GAMBIT'}`
                    : '';
                    
                const respinTimerLine = respinResult.blockInfo 
                    ? `⏱️ Time remaining: ${blocksRemaining || respinResult.blockInfo.blocksRemaining || '?'} blocks`
                    : '';
                
                const respinActionText = `Type 'accept' to claim${respinPrize > 0 ? ' prize' : ''} or 'respin' to try again (cost: ${respinResult.costToRespin})`;
                
                return {
                    output: [
                        respinResult.description,
                        respinPrizeText,
                        respinTimerLine,
                        respinActionText
                    ].filter(line => line),
                    outcome: respinResult.outcome?.slice(0, 3),
                };
            case "status":
                if (pendingSpinResult) {
                    await updateBlocksRemaining(); // Get latest block info
                    
                    // Create a more prominent timer display with formatting
                    const timerDisplay = `⏱️ Time remaining: ${blocksRemaining || '?'} blocks`;
                    const statusPrize = Number(pendingSpinResult.prize);
                    
                    return {
                        output: [
                            "=== PENDING SPIN STATUS ===",
                            pendingSpinResult.description,
                            `Prize: ${pendingSpinResult.prize} ${pendingSpinResult.prizeType === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : 'GAMBIT'}`,
                            timerDisplay,
                            `Respin cost: ${pendingSpinResult.costToRespin} ${wagmiConfig.chains[0].nativeCurrency.symbol}`,
                            `Block deadline: ${pendingSpinResult.blockInfo?.blockDeadline} (current: ${pendingSpinResult.blockInfo?.currentBlock})`,
                            "",
                            `Type 'accept' to claim${statusPrize > 0 ? ' prize' : ''} or 'respin' to try again`,
                            "==========================="
                        ],
                        outcome: pendingSpinResult.outcome?.slice(0, 3),
                    };
                } else {
                    return {output: ["No pending spin. Type 'spin' to play!"]};
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

    // No separate status bar - information will be in command output
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