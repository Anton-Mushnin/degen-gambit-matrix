import { useState } from "react";
import { numbers } from "../config/symbols";
import Matrix from "./Matrix";          
import { useQueryClient } from "@tanstack/react-query";
import { DegenGambitCommandParams } from '../commands/commands/degenGambit';
import { Terminal } from "./matrix-ui/Terminal";
import RandomNumbers from "./RandomNumbers";
import styles from './MatrixTerminal.module.css';
import { useAccountToUse } from "../hooks/useAccountToUse";
import { useDegenGambitGame } from '../hooks/useDegenGambitGame';
import { useTerminal } from '../hooks/useTerminal';

const phrasesToType = ['Wake up', 'The Matrix', 'Prize'];

declare global {
    interface Window {
        ethereum?: any;
    }
}


const DegenGambit = () => {
    const queryClient = useQueryClient();
    const { address: playerAddress } = useAccountToUse();
    
    const [gameState, gameActions] = useDegenGambitGame();
    const { isWin, autoSpin } = gameState;
    
    const [isSpinning, setIsSpinning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outcome, setOutcome] = useState<string[]>([]);
    
    

    const gameParams: DegenGambitCommandParams = {
        onSetNumbers: gameActions.setUserNumbers,
        getCurrentNumbers: gameActions.getCurrentNumbers,
        onAutoSpinToggle: gameActions.toggleAutoSpin,
        setIsWin: gameActions.setIsWin,
        autoSpin: autoSpin,
    }
    

    const { outputQueue, setOutputQueue, handleInput } = useTerminal(gameParams);
    
    
    const _handleInput = async (input: string) => {
        if (input === 'clear') {
            setOutputQueue([]);
            return;
        }

        if (['spin', 'respin', 'spin boost'].includes(input)) {
            setIsSpinning(true);
        } else {
            console.log(['spin', 'respin', 'spin boost'].includes(input));
            console.log(input);
        }
        setIsProcessing(true)
        try {
            const result = await handleInput(input);
            console.log('result', result);
            if (result?.output && !result.outcome) {
                const outputText = result.output.join('\n');
                if (outputText) { 
                    setOutputQueue(prev => [...prev, {text: outputText, toType: false}]);
                }
            } else if (result?.outcome) {
                console.log('autoSpin', autoSpin, input);
                if (autoSpin && input.startsWith('spin')) {
                    setTimeout(() => {
                        const gambitBalance = queryClient.getQueryData(['accountGambitBalance', playerAddress]) as {value: bigint};
                        const isBoosted = gambitBalance && gambitBalance.value > BigInt(1);
                        _handleInput('spin' + (isBoosted ? ' boost' : ''));
                    }, result.isPrize ? 22000 : 13000)
                }
                const outcomeValues = result.outcome.map(item => numbers[Number(item)].toString());
                setOutcome(outcomeValues);
                setTimeout(() => {
                    console.log('outcomeValues', outcomeValues);
                    setOutputQueue(prev => [...prev, {text: outcomeValues.join(' '), toType: false}]);
                    const outputText = result.output.join('\n');
                    if (outputText) { 
                        setOutputQueue(prev => [...prev, {text: outputText, toType: phrasesToType.some(str => outputText.startsWith(str))}]);
                    }
                    setOutcome([]);
                }, 8000);
            }
        } catch (error: any) {
            if (autoSpin && input.startsWith('spin')) {
                const gambitBalance = queryClient.getQueryData(['accountGambitBalance', playerAddress]) as {value: bigint};
                const isBoosted = gambitBalance && gambitBalance.value > BigInt(1);
                handleInput('spin' + (isBoosted ? ' boost' : ''));
            }
            const errorMessage = error.message ?? String(error);
            setOutputQueue(prev => [...prev, {text: errorMessage, toType: false}]);
        } finally {
            setIsSpinning(false);
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', maxHeight: '100%', height: '100%', paddingTop: '20px'}}>
            {isWin && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 10
                }}>
                    <Matrix outcome={[1,1,1]} onClose={() => gameActions.setIsWin(false)} />
                </div>
            )}
            <Terminal queue={{
                        length: outputQueue.length, 
                        shift: () => {
                            const item = outputQueue.shift();
                            setOutputQueue([...outputQueue]); // Trigger re-render
                            return item;
                        }
                    }} 
                    onSubmit={_handleInput} 
                    isInputDisabled={isProcessing || isSpinning || outcome.length > 0}>

            {isSpinning && (
                <div className={styles.spinningContainer}>
                    <RandomNumbers />
                    <RandomNumbers />
                    <RandomNumbers />
                </div>
            )}
            {outcome.length > 0 && (
                <div className={styles.spinningContainer}>
                    {outcome.map((item, index) => (
                        <RandomNumbers key={index} result={item} duration={2000 + index * 2000} />
                    ))}
                </div>
            )}
            </Terminal>
        </div>
    );
};

export default DegenGambit;