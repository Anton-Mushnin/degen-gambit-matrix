import { useGameContext } from "../contexts/GameContext";
import { useDevMode } from "../contexts/DevModeContext";
import { getGameConfig, GameContractConfig } from "../utils/gameConfig";
import GameMain from "./GameMain";
import GameContractInfo from "./GameContractInfo";
import GameContractConstants from "./GameContractConstants";
import GameStream from "./GameStream";
import styles from "./Home.module.css";

const Home = () => {
    const { activeGame } = useGameContext();
    const { isDevMode } = useDevMode();

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

    // Get game components and configurations
    const components = activeGame.components;
    const GameContextProvider = activeGame.context;

    // Instantiate main component - either generic or custom
    let MainComponent: React.ComponentType | null = null;
    if (components.main) {
      if (typeof components.main === 'function') {
        // Custom component (like DegenGambitMain)
        MainComponent = components.main as React.ComponentType;
      } else {
        // Generic GameMainConfig
        const mainConfig = components.main as any;
        MainComponent = () => <GameMain displayComponents={mainConfig.displayComponents} />;
      }
    }
    const RulesComponent = components.rules;
    const ContractInfoComponent = components.contractInfo ? () => {
        // Resolve contract address and ABI based on dev mode (same pattern as GameStream)
        let contractAddress = '';
        let contractABI = null;

        if (components.contractInfo!.gameContractConfig) {
            const gameConfig = getGameConfig(
                components.contractInfo!.gameContractConfig as GameContractConfig,
                isDevMode
            );
            contractAddress = gameConfig.contractAddress;
            contractABI = gameConfig.abi;
        }

        return (
            <GameContractInfo
                createDataItems={(params) => components.contractInfo!.createDataItems({
                    ...params,
                    contractAddress,
                    contractABI
                })}
            />
        );
    } : null;

    const ContractConstantsComponent = components.contractConstants ? () => {
        // Resolve contract address and ABI based on dev mode
        let contractAddress = '';
        let contractABI = null;

        if (components.contractConstants!.gameContractConfig) {
            const gameConfig = getGameConfig(
                components.contractConstants!.gameContractConfig as GameContractConfig,
                isDevMode
            );
            contractAddress = gameConfig.contractAddress;
            contractABI = gameConfig.abi;
        }

        return (
            <GameContractConstants
                createContractConstantsData={(params) => components.contractConstants!.createContractConstantsData({
                    ...params,
                    contractAddress,
                    contractABI
                })}
            />
        );
    } : null;
    const StreamComponent = components.stream ? () => {
        // Resolve contract address and ABI based on dev mode
        const gameConfig = getGameConfig(
            components.stream!.gameContractConfig as GameContractConfig,
            isDevMode
        );

        return (
            <GameStream
                contractAddress={gameConfig.contractAddress}
                abi={gameConfig.abi}
                eventConfigs={components.stream!.eventConfigs}
                chainId={activeGame.network.id}
            />
        );
    } : null;

    const gameContent = (
        <div className={styles.container}>
            <div className={`${styles.stack} ${styles.leftPanel}`}>
                {ContractInfoComponent && <ContractInfoComponent />}
                {StreamComponent && (
                    <div className={styles.streamComponent}>
                        <StreamComponent />
                    </div>
                )}
            </div>
            <div className={`${styles.stack} ${styles.rightPanel}`}>
                {MainComponent && <MainComponent />}
                {RulesComponent && <RulesComponent />}
                {ContractConstantsComponent && (
                    <div className={styles.constantsComponent}>
                        <ContractConstantsComponent />
                    </div>
                )}
            </div>
        </div>
    );

    // Wrap with game context provider if it exists
    if (GameContextProvider) {
        return <GameContextProvider>{gameContent}</GameContextProvider>;
    }

    return gameContent;
};

export default Home;