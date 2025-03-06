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
    const [isSpinning, setIsSpinning] = useState(false);


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
                    setIsSpinning(true);
                    const spinResult = await spin(contractAddress, false, activeAccount, client, activeWallet);
                    setIsSpinning(false);
                    return {
                        output: [spinResult.description],
                        outcome: spinResult.outcome?.slice(0, 3),
                    };
                    case "symbols": {
                        return {output: ["Minor symbols:", numbers.slice(1, 15).join(', '), "Major symbols:",   numbers.slice(-3).join(', ')]};
                    }
            default:
                return {output: [                    "Available commands:",
                    "  spin     - Spin the wheel",
                    "  balance  - Check your native and gambit token balances",
                    "  getsome  - Visit getsome.game7.io to get some tokens",
                    "  info     - Show game parameters and costs",
                    "  prizes   - Display current prize pool",
                    "  streaks  - View your daily and weekly streaks",
                    "  symbols  - Display minor and major symbols",
                    "  clear    - Clear the terminal (⌘K or Ctrl+K)",
                ],
            };
        }
    }

    return (
        <div>
            <MatrixTerminal onUserInput={handleInput} />
        </div>
    )
}


export default DegenGambit;