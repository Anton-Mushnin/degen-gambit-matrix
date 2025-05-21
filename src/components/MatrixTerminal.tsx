import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Chain } from 'thirdweb/chains';
import { createThirdwebClient } from 'thirdweb';
import { useActiveAccount, useActiveWallet, useConnectModal } from 'thirdweb/react';

import { thirdwebClientId, thirdWebG7Testnet } from '../config';
import { useAccountToUse } from '../hooks/useAccountToUse';
import { Terminal } from './matrix-ui/Terminal';
import RandomNumbers from './RandomNumbers';
import styles from './MatrixTerminal.module.css';

const phrasesToType = ['Wake up', 'The Matrix', 'Prize'];

interface MatrixTerminalProps {
  onUserInput?: (input: string) => Promise<{output: string[], outcome?: bigint[], isPrize?: boolean}>;
  numbers: number[];
  autoSpin: boolean;
}

export const MatrixTerminal = ({ onUserInput, numbers, autoSpin }: MatrixTerminalProps) => {

  const [isSystemTyping, setIsSystemTyping] = useState(true);
  const { connect } = useConnectModal();
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const client = createThirdwebClient({ clientId: thirdwebClientId });
  const [isSpinning, setIsSpinning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false)
  const { displayName } = useAccountToUse();

  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<string[]>([]);

  const [outputQueue, setOutputQueue] = useState<{text: string, toType: boolean}[]>([]);

  // Add ref for the container
  const containerRef = useRef<HTMLDivElement>(null);

  // Track if we've shown the welcome message
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Add scroll to bottom effect when history changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history, isSystemTyping, isSpinning, outcome]);

  useEffect(() => {
    if (!activeAccount) {
        connect({client});
    }
    if (displayName && !welcomeShown) {
        setOutputQueue(prev => [...prev, {text: `Wake up, ${displayName}`, toType: true}]);
        setIsSystemTyping(true);
        setWelcomeShown(true);
    }
  }, [activeAccount, connect, client, welcomeShown, displayName]);

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



  const handleInput = async (input: string) => {
    if (input === 'clear') {
      setOutputQueue([]);
      return;
    }

    if (['spin', 'respin', 'spin boost'].includes(input)) {
      setIsSpinning(true);
    }
    setIsProcessing(true)
    try {
        const result = await onUserInput?.(input);

        if (result?.output && !result.outcome) {
            const outputText = result.output.join('\n');
            if (outputText) { 
                setOutputQueue(prev => [...prev, {text: outputText, toType: false}]);
            }
        } else if (result?.outcome) {
            if (autoSpin && input.startsWith('spin')) {
              setTimeout(() => {
                const gambitBalance = queryClient.getQueryData(['accountGambitBalance', activeAccount?.address]) as {value: bigint};
                const isBoosted = gambitBalance && gambitBalance.value > BigInt(1);
                handleInput('spin' + (isBoosted ? ' boost' : ''));
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

        <Terminal queue={{
                    length: outputQueue.length, 
                    shift: () => {
                        const item = outputQueue.shift();
                        setOutputQueue([...outputQueue]); // Trigger re-render
                        return item;
                    }
                }} 
                  onSubmit={handleInput} 
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
  );
}; 