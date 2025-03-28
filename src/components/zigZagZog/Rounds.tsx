import styles from "./Rounds.module.css";
import { RoundState } from "../../utils/playerState";
import { EliminationResult } from "../../utils/gameAndRoundState";

interface ShareInfo {
    purchasedPlays: number;
    gameBalance: number;
}

const Rounds = ({rounds, shareInfo, hasGameEnded}: {rounds: RoundState[], shareInfo: ShareInfo | undefined, hasGameEnded: boolean}) => {
    


    return (
        <div className={styles.container}>
            <div className={styles.roundContainer}>
                {rounds.map((round, index) => (
                    round.totalShapes.circles + round.totalShapes.squares + round.totalShapes.triangles > 0 && (
                    <div className={styles.round} key={index}>
                        <span>Round {round.roundNumber}</span>
                        <span style={{textDecoration: `${   round.eliminationResult === EliminationResult.CircleEliminated ? 'line-through' : 'none'}`}}>{round.totalShapes.circles} circles</span>
                        <span style={{textDecoration: `${round.eliminationResult === EliminationResult.SquareEliminated ? 'line-through' : 'none'}`}}>{round.totalShapes.squares} squares</span>
                        <span style={{textDecoration: `${round.eliminationResult === EliminationResult.TriangleEliminated ? 'line-through' : 'none'}`}}>{round.totalShapes.triangles} triangles</span>
                        <span>{round.eliminationResult.toString()}</span>
                        {shareInfo && shareInfo.purchasedPlays > 0 && <span>Surviving Plays: {round.survivingPlays}</span>}
                        {hasGameEnded && shareInfo && shareInfo.purchasedPlays > 0 && index === rounds.length - 2 && round.survivingPlays === 0 && <span>loss</span>}
                        {hasGameEnded && shareInfo && shareInfo.purchasedPlays > 0 && index === rounds.length - 2 && round.survivingPlays > 0 && <span>win</span>}

                        {hasGameEnded && shareInfo && shareInfo.purchasedPlays === 0 && index === rounds.length - 2 && <span>Game Ended</span>}
                    </div>
                    )
                ))}
            </div>
        </div>
    )
}

export default Rounds