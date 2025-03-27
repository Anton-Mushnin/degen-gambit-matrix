import styles from "./Rounds.module.css";
import { RoundState } from "../../utils/playerState";
import { EliminationResult } from "../../utils/gameAndRoundState";

const Rounds = ({rounds}: {rounds: RoundState[]}) => {
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
                        <span>Surviving Plays: {round.survivingPlays}</span>
                    </div>
                    )
                ))}
            </div>
        </div>
    )
}

export default Rounds