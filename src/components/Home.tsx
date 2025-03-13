import ContractInfo from "./ContractInfo";
import DegenGambit from "./DegenGambit";
import styles from "./Home.module.css";
import Stream from "./Stream";
const Home = () => {
    return (
        <div className={styles.container}>
            <div className={styles.stack}>
                <ContractInfo />
            </div>
            <div className={styles.stack} style={{flex: '1', backgroundColor: 'red'}}>
                <DegenGambit />
            </div>
            <div className={styles.stack}>
                <Stream />
            </div>
        </div>
    );
};

export default Home;