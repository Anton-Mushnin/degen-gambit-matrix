import { MatrixTerminal } from "./MatrixTerminal";
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { contractAddress, thirdwebClientId, wagmiConfig } from '../config';
import { getStreaks, getBalances, spin } from "../utils/degenGambit";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { useState } from "react";
import { numbers } from "../config/symbols";
const DegenGambit = () => {
    const contractInfo = useDegenGambitInfo(contractAddress)
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const client = createThirdwebClient({ clientId: thirdwebClientId });
    const [userNumbers, setUserNumbers] = useState<number[]>(numbers);


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
                    return {
                        output: [spinResult.description],
                        outcome: spinResult.outcome?.slice(0, 3),
                    };
                    case "symbols": {
                        return {output: ["Minor symbols:", userNumbers.slice(1, 15).join(', '), "Major symbols:",   userNumbers.slice(-3).join(', ')]};
                    }
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
                        return {output: ["Minor symbols:", newNumbers.slice(1, 15).join(', '), "Major symbols:",   newNumbers.slice(-3).join(', ')]};
                    }
            default:
                return {output: [
                    "Available commands:",
                    "  spin     - Spin the wheel",
                    "  balance  - Check your native and gambit token balances",
                    "  getsome  - Visit getsome.game7.io to get some tokens",
                    "  info     - Show game parameters and costs",
                    "  prizes   - Display current prize pool",
                    "  streaks  - View your daily and weekly streaks",
                    "  symbols  - Display minor and major symbols",
                    "  set      - Set symbol at index (set <1-based index> <number>)",
                    "  clear    - Clear the terminal (⌘K or Ctrl+K)",
                ],
            };
        }
    }

    return (
        <div>
            <MatrixTerminal onUserInput={handleInput} numbers={userNumbers} />
        </div>
    )
}


export default DegenGambit;