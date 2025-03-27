import { ShapeSelection } from "@/utils/signing";
import styles from "./ShapeSelector.module.css";
import Circle from "./shapes/Circle";
import Triangle from "./shapes/Triangle";
import Square from "./shapes/Square";
import { useEffect } from "react";


const ShapeSelector = ({playsCount, selected, onSelect, isCommitPhase}: {playsCount: number, selected: ShapeSelection, onSelect: (shapes: ShapeSelection) => void, isCommitPhase: boolean}) => {
    
    
    
    const getStrokeColor = (count: bigint) => {
        if (count === BigInt(0)) return 'gray';
        const hue = 160 - (Number(count) - 1) / (playsCount - 1) * 100;
        const saturation = Math.max(10, (Number(count) - 1) / (playsCount - 1) * 100);
        return `hsl(${hue}, ${saturation}%, 50%)`;
    };

    useEffect(() => {
        if (BigInt(playsCount) < selected.circles + selected.triangles + selected.squares) {
            onSelect({circles: BigInt(0), squares: BigInt(0), triangles: BigInt(0)})
        }
    }, [playsCount])

    const handleShapeClick = (shape: keyof ShapeSelection, d: number) => {
        if (!isCommitPhase) {
            return
        }
        const newCount = selected[shape] + BigInt(d);

        if ((playsCount > selected.circles + selected.triangles + selected.squares || d < 0) && isCommitPhase && newCount >= BigInt(0)) {
            onSelect({...selected, [shape]: newCount});
        }
    }
    return (
        <div className={styles.container}>
            <div className={styles.shapeContainer}>
                <div className={styles.shape}>
                    <Circle stroke={getStrokeColor(selected.circles)} />
                    <div className={styles.shapeCount}>{selected.circles}</div>
                </div>
                <div className={styles.buttons}>
                    <div className={styles.plusButton} onClick={() => handleShapeClick("circles", -1)}><div className={styles.caption}>less</div></div>
                    <div className={styles.plusButton} onClick={() => handleShapeClick("circles", 1)}><div className={styles.caption}>more</div></div>
                </div>
            </div>
            <div className={styles.shapeContainer}>
                <div className={styles.shape}>
                    <Triangle fill={getStrokeColor(selected.triangles)} />
                    <div className={styles.shapeCount}>{selected.triangles}</div>
                </div>
                <div className={styles.buttons}>
                    <div className={styles.plusButton} onClick={() => handleShapeClick("triangles", -1)}><div className={styles.caption}>less</div></div>
                    <div className={styles.plusButton} onClick={() => handleShapeClick("triangles", 1)}><div className={styles.caption}>more</div></div>
                </div>
            </div>
            <div className={styles.shapeContainer}>
                <div className={styles.shape}>
                    <Square stroke={getStrokeColor(selected.squares)} />
                    <div className={styles.shapeCount}>{selected.squares}</div>
                </div>
                <div className={styles.buttons}>
                    <div className={styles.plusButton} onClick={() => handleShapeClick("squares", -1)}><div className={styles.caption}>less</div></div>
                    <div className={styles.plusButton} onClick={() => handleShapeClick("squares", 1)}><div className={styles.caption}>more</div></div>
                </div>
            </div>
        </div>
    )
}

export default ShapeSelector;