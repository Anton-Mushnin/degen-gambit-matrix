import { ZIG_ZAG_ZOG_ADDRESS } from "./ZIgZagZog";
import styles from "./ZzzHistory.module.css";
import {useQuery} from "@tanstack/react-query";
import { playerRecentGames } from "../../utils/zigZagZog";
import RecentGameView from "./RecentGameView";

const ZzzHistory = ({player}: {player: string}) => {
    const games = useQuery({
        queryKey: ['playerRecentGames', player],
        queryFn: async () => { 
            const recentGames = await playerRecentGames(ZIG_ZAG_ZOG_ADDRESS, player)
            console.log(recentGames)
            return recentGames.map((game) => ({
                gameNumber: game.gameNumber.toString(),
                plays: game.plays?.toString() ?? '',
                survivingPlays: game.survivingPlays?.toString() ?? '',
                cashedOut: !!game.cashedOut,
                roundNumber: game.roundNumber
            }))
        },
        enabled: !!player,
    })


    return (
        <div className={styles.container}>
            {games.data && 'Recent games OK'}
            {games.data && games.data.map((game) => <RecentGameView key={game.gameNumber} game={game} player={player} />)}
        </div>
    )
}

export default ZzzHistory;