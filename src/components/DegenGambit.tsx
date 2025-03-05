import { MatrixTerminal } from "./MatrixTerminal";
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { contractAddress, thirdwebClientId, wagmiConfig } from '../config';
import { getStreaks, getBalances, spin } from "../utils/degenGambit";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
const DegenGambit = () => {
    const contractInfo = useDegenGambitInfo(contractAddress)
    const activeAccount = useActiveAccount();
    const activeWallet = useActiveWallet();
    const client = createThirdwebClient({ clientId: thirdwebClientId });


    const handleInput = async (input: string) => {
        switch (input) {
            case "info":
                return [
                    `Cost to spin: ${contractInfo.data?.costToSpin}`,
                    `Cost to respin: ${contractInfo.data?.costToRespin}`,
                    `Blocks to act: ${contractInfo.data?.blocksToAct} (~${contractInfo.data?.secondsToAct} seconds)`,
                ];
                case "prizes":
                    return contractInfo.data?.prizes;
                case "getsome": 
                    window.open("https://getsome.game7.io", "_blank");
                    return [];
                case "streaks":
                    const streaks = await getStreaks(contractAddress, activeAccount?.address ?? "");
                    return [
                        `Daily streak: ${streaks.dailyStreak}`,
                        `Weekly streak: ${streaks.weeklyStreak}`,
                    ];
                case "balance":
                    const balances = await getBalances(contractAddress, activeAccount?.address ?? "");
                    return [
                        `Native token balance: ${balances.nativeBalance} ${wagmiConfig.chains[0].nativeCurrency.symbol}`,
                        `Gambit token balance: ${balances.balance} ${balances.symbol}`,
                    ];
                case "spin":
                    if (!activeAccount || !activeWallet) {
                        return ["No account selected"];
                    }
                    const spinResult = await spin(contractAddress, false, activeAccount, client, activeWallet);
                    return [
                        `Spin result: ${spinResult}`,
                    ];
            default:
                return [                    "Available commands:",
                    "  spin     - Spin the wheel",
                    "  balance  - Check your native and gambit token balances",
                    "  getsome  - Visit getsome.game7.io to get some tokens",
                    "  info     - Show game parameters and costs",
                    "  prizes   - Display current prize pool",
                    "  streaks  - View your daily and weekly streaks",
                ];
        }
    }

    return (
        <div>
            <MatrixTerminal onUserInput={handleInput} />
        </div>
    )
}


export default DegenGambit;