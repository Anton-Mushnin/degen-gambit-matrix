import { ShapeSelection } from "@/utils/signing";
import styles from "./ShapeSelector.module.css";


const ShapeSelector = ({playsCount, selected, onSelect, isCommitPhase}: {playsCount: number, selected: ShapeSelection, onSelect: (shapes: ShapeSelection) => void, isCommitPhase: boolean}) => {
    const handleShapeClick = (shape: keyof ShapeSelection) => {
        if (playsCount > selected.circles + selected.triangles + selected.squares && isCommitPhase) {
            onSelect({...selected, [shape]: selected[shape] + BigInt(1)});
        }
    }
    return (
        <div className={styles.container}>
            <div className={styles.shapeContainer}>
                <div className={styles.shape} onClick={() => handleShapeClick("circles")}>
                    <div className={styles.shapeCircle}>CCC</div>
                </div>
                <div className={styles.shapeCount}>{selected.circles}</div>
            </div>
            <div className={styles.shapeContainer}>
                <div className={styles.shape} onClick={() => handleShapeClick("triangles")}>
                    <div className={styles.shapeTriangle}>TTT</div>
                </div>
                <div className={styles.shapeCount}>{selected.triangles}</div>
            </div>
            <div className={styles.shapeContainer}>
                <div className={styles.shape} onClick={() => handleShapeClick("squares")}>
                    <div className={styles.shapeSquare}>SSS</div>
                </div>
                <div className={styles.shapeCount}>{selected.squares}</div>
            </div>
        </div>
    )
}

export default ShapeSelector;