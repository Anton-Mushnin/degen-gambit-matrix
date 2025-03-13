import ContractInfo from "./ContractInfo";
import DegenGambit from "./DegenGambit";
import styles from "./Home.module.css";
import Rules from "./Rules";
import Stream from "./Stream";
const Home = () => {
    return (
        <div className={styles.container}>
            <div className={styles.stack} style={{borderRight: '1px solid #636363'}}>
                <ContractInfo />
                <Stream />
            </div >
            <div className={styles.stack} style={{flex: '1'}}>
                <DegenGambit />
                <Rules />
            </div>
        </div>
    );
};

export default Home;