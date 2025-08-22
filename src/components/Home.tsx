import { useGameContext } from "../contexts/GameContext";
import styles from "./Home.module.css";

const Home = () => {
    const { activeGame } = useGameContext();

    // If no active game, show a default message
    if (!activeGame) {
        return (
            <div className={styles.container}>
                <div className={styles.stack} style={{borderRight: '1px solid #636363'}}>
                    <div style={{ padding: '20px', color: '#00ff41' }}>
                        <h2>No Active Game</h2>
                        <p>Use terminal commands to switch to a game:</p>
                        <ul>
                            <li>Type "games" to see available games</li>
                            <li>Type a game name to switch (e.g., "degen-gambit")</li>
                        </ul>
                    </div>
                </div>
                <div className={styles.stack} style={{flex: '1'}}>
                    <div style={{ padding: '20px', color: '#00ff41' }}>
                        <h3>Available Commands:</h3>
                        <ul>
                            <li>games - List available games</li>
                            <li>games switch &lt;name&gt; - Switch to a game</li>
                            <li>help - Show help</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Get game components
    const components = activeGame.components;
    const MainComponent = components.main;
    const RulesComponent = components.rules;
    const ContractInfoComponent = components.contractInfo;
    const StreamComponent = components.stream;

    return (
        <div className={styles.container}>
            <div className={styles.stack} style={{borderRight: '1px solid #636363'}}>
                {ContractInfoComponent && <ContractInfoComponent />}
                {StreamComponent && <StreamComponent />}
            </div>
            <div className={styles.stack} style={{flex: '1'}}>
                {MainComponent && <MainComponent />}
                {RulesComponent && <RulesComponent />}
            </div>
        </div>
    );
};

export default Home;