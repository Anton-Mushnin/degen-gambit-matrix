import { claimWinning, getRounds } from "../../utils/zigZagZog";
import styles from "./RecentGameView.module.css";
import { ZIG_ZAG_ZOG_ADDRESS } from "./ZIgZagZog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { WalletClient } from "viem";
import { createWalletClient } from "viem";
import { custom } from "viem";
import { viemG7Testnet } from "../../config";

const RecentGameView = ({game, player}: {game: {gameNumber: string, plays: string, survivingPlays: string, cashedOut: boolean, roundNumber: number}, player: string}) => {


    const rounds = useQuery({
        queryKey: ["rounds", game.gameNumber],
        queryFn: async () => {
            console.log('Game', game.gameNumber, 'roundNumber', game.roundNumber)
            const rounds = await getRounds(ZIG_ZAG_ZOG_ADDRESS, game.gameNumber, BigInt(game.roundNumber), player)
            console.log('Game', game.gameNumber, 'rounds', rounds)
            return rounds
        }
    })

    const claimWinningsMutation = useMutation({
        mutationFn: async () => {
            let _client: WalletClient | undefined;
            if (window.ethereum && player) {
                _client = createWalletClient({
                    account: player,
                    chain: viemG7Testnet,
                    transport: custom(window.ethereum)
                });
            }
            if (!_client) {
                throw new Error("No client found");
            }
            const tx = await claimWinning(ZIG_ZAG_ZOG_ADDRESS, BigInt(game.gameNumber), _client)
            return tx
        }
    })

    return (
        <>
        {rounds.data && (<div className={styles.container}>
            <div className={styles.gameNumber}>Game {Number(game.gameNumber)}</div>
            <div className={styles.plays}>Plays {Number(game.plays)}</div>
            <div className={styles.survivingPlays}>Surviving Plays {Number(game.survivingPlays)}</div>
            {!game.cashedOut && <button onClick={() => claimWinningsMutation.mutate()}>Claim Winnings</button>}
        </div>)}
        </>
    )
}

export default RecentGameView;