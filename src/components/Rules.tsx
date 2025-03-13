import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { contractAddress } from '../config';
import styles from './Rules.module.css';
import { numbers } from '../config/symbols';

const Rules = () => {
    const contractInfo = useDegenGambitInfo(contractAddress);

    return ( 
        <div className={styles.container}>
            <div className={styles.constants}>
                <div className={styles.constant}>Contract address: {contractAddress}</div>
                <div className={styles.constant}>Blocks to act: {contractInfo.data?.blocksToAct}</div>
                <div className={styles.constant}>Cost to spin: {contractInfo.data?.costToSpin}</div>
                <div className={styles.constant}>Cost to respin: {contractInfo.data?.costToRespin}</div>
            </div>
            <div className={styles.prizes}>
                <div className={styles.prize}>Rewards:</div>
                {contractInfo.data?.prizes.map((prize, index) => (
                    <div key={index} className={styles.prize}>{prize}</div>
                ))}
            </div>
            <div className={styles.symbols}>
                <div className={styles.symbol}>{`Minor symbols: ${numbers.slice(1, 16).join(', ')}`}</div>
                <div className={styles.symbol}>{`Major symbols: ${numbers.slice(-3).join(', ')}`}</div>
            </div>
        </div>
    )
}

export default Rules;