import { thirdwebClientId, thirdWebG7Testnet } from '../config';
import { useActiveAccount, useActiveWallet, useConnectModal } from "thirdweb/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { numbers } from "../config/symbols";
import Matrix from "./Matrix";
import { useQueryClient } from "@tanstack/react-query";
import { Chain, createThirdwebClient } from "thirdweb";
import { CommandDispatcher } from '../commands/dispatcher';
import { degenGambitCommands, DegenGambitCommandParams, SpinResult } from '../commands/commands/degenGambit';
import { loggingMiddleware, errorHandlingMiddleware } from '../commands/middleware';
import { _accept, _acceptThirdWebClient } from "../utils/degenGambit";
import { Terminal } from "./matrix-ui/Terminal";
import RandomNumbers from "./RandomNumbers";
import styles from './MatrixTerminal.module.css';
import { useAccountToUse } from "../hooks/useAccountToUse";

const phrasesToType = ['Wake up', 'The Matrix', 'Prize'];



declare global {
    interface Window {
        ethereum?: any;
    }
}

const AUTO_ACCEPT = true;

const DegenGambit = () => {
    const activeAccount = useActiveAccount();
    const [userNumbers, setUserNumbers] = useState<number[]>(numbers);
    const [isWin, setIsWin] = useState(false);
    const [autoSpin, setAutoSpin] = useState(false);
    const client = createThirdwebClient({ clientId: thirdwebClientId });


    const activeWallet = useActiveWallet();
    const [outputQueue, setOutputQueue] = useState<{text: string, toType: boolean}[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [outcome, setOutcome] = useState<string[]>([]);
    const { connect } = useConnectModal();
    const [welcomeShown, setWelcomeShown] = useState(false);
    const { displayName } = useAccountToUse();
    const queryClient = useQueryClient();







    // Command handlers
    const handleSetNumbers = useCallback((newNumbers: number[]) => {
        setUserNumbers(newNumbers);
    }, []);

    const handleAutoSpinToggle = useCallback(() => {
        setAutoSpin(!autoSpin);
    }, [autoSpin]);

    const getCurrentNumbers = useCallback(async () => {
        return userNumbers;
    }, [userNumbers]);

    // Create and configure command dispatcher
    const dispatcher = useMemo(() => {
        const d = new CommandDispatcher<DegenGambitCommandParams>();
        
        // Register all DegenGambit commands
        degenGambitCommands.forEach(cmd => d.register(cmd));
        
        // Add global middleware
        d.use(loggingMiddleware);
        d.use(errorHandlingMiddleware);
        
        return d;
    }, []);

    const handleInput = async (input: string) => {
        const params: DegenGambitCommandParams = {
            activeAccount,
            client,
            onSetNumbers: handleSetNumbers,
            getCurrentNumbers,
            onAutoSpinToggle: handleAutoSpinToggle,
            setIsWin,
        };

        const result = await dispatcher.dispatch(input, params);
        console.log(result);
        return result;
    };



//NEW 

    useEffect(() => {
        if (activeWallet) {
        const chain = activeWallet.getChain();
        if (chain?.id !== thirdWebG7Testnet.id) {
            activeWallet.switchChain(thirdWebG7Testnet as Chain);
        }
        }
    }, [activeWallet]);

    useEffect(() => {
        if (autoSpin !== undefined) {
        setOutputQueue(prev => [...prev, {text: `Auto spin: ${autoSpin}`, toType: false}]);
        }
    }, [autoSpin]);

    useEffect(() => {
        if (!activeAccount) {
            connect({client});
        }
        if (displayName && !welcomeShown) {
            setOutputQueue(prev => [...prev, {text: `Wake up, ${displayName}`, toType: true}]);
            // setIsSystemTyping(true);
            setWelcomeShown(true);
        }
    }, [activeAccount, connect, client, welcomeShown, displayName]);

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
                    const gambitBalance = queryClient.getQueryData(['accountGambitBalance', activeAccount?.address]) as {value: bigint};
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
              const gambitBalance = queryClient.getQueryData(['accountGambitBalance', activeAccount?.address]) as {value: bigint};
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
                    <Matrix outcome={[1,1,1]} onClose={() => setIsWin(false)} />
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
                    isProcessing={isProcessing || isSpinning || outcome.length > 0}>

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