import { thirdwebClientId, thirdWebG7Testnet } from '../config';
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { createThirdwebClient } from 'thirdweb';
import { useActiveAccount, useActiveWallet, useConnectModal } from 'thirdweb/react';
import { TerminalOutput } from './TerminalOutput';
import styles from './MatrixTerminal.module.css';
import RandomNumbers from './RandomNumbers';
import { Chain } from 'thirdweb/chains';

const color = '#a1eeb5';
const glow = '#0dda9f';

const Container = styled.div`
    background-color:rgb(15, 15, 15);
    font-family: 'NimbusMono', 'Courier New', Courier, monospace;
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: start;
    min-height: 100vh;
    width: calc(100vw - 10px);
    max-height: 100vh;
    padding: 40px;
    gap: 0px;
    color: ${color};
    text-shadow: 0 0 12px ${glow};
    font-size: 16px;
`;

const Cursor = styled.span`
  font-size: 12px;
  animation: blink 1s step-end infinite;
  color: ${color};
  text-shadow: 0 0 10px ${glow};
  
  @keyframes blink {
    50% { opacity: 0; }
  }
`;

interface MatrixTerminalProps {
  onUserInput?: (input: string) => Promise<{output: string[], outcome?: bigint[]}>;
  numbers: number[];
}

export const MatrixTerminal = ({ onUserInput, numbers }: MatrixTerminalProps) => {
  const [userInput, setUserInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [inputHistoryIndex, setInputHistoryIndex] = useState(-1);

  const [isSystemTyping, setIsSystemTyping] = useState(true);
  const { connect } = useConnectModal();
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const client = createThirdwebClient({ clientId: thirdwebClientId });
  const [text, setText] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);

  const [rerenderKey, setRerenderKey] = useState(0);
  const [outcome, setOutcome] = useState<string[]>([]);

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
    if (activeAccount && !welcomeShown) {
        setText(`Wake up, ${activeAccount.address}`);
        setIsSystemTyping(true);
        setWelcomeShown(true);
    }
  }, [activeAccount, connect, client, welcomeShown]);

  useEffect(() => {
    if (activeWallet) {
      const chain = activeWallet.getChain();
      if (chain?.id !== thirdWebG7Testnet.id) {
        activeWallet.switchChain(thirdWebG7Testnet as Chain);
      }
    }
  }, [activeWallet]);

  useEffect(() => {
    if (!isSystemTyping && text) {
      setHistory(prev => [...prev, text]);
      // Clear the text after adding it to history to prevent re-adding
      setText('');
    }
  }, [isSystemTyping, text]);

  const handleInput = useCallback(async (input: string) => {
    if (input === 'clear') {
      setHistory([]);
      return;
    }

    if (input === 'spin') {
      setIsSpinning(true);
    }
    try {
        const result = await onUserInput?.(input);
        if (result?.output && !result.outcome) {
            const outputText = result.output.join('\n');
            if (outputText) {  // Only set text if there's actual output
                setText(outputText);
                setIsSystemTyping(true);
            }
        } else if (result?.outcome) {
            const outcomeValues = result.outcome.map(item => numbers[Number(item)].toString());
            setOutcome(outcomeValues);
            setTimeout(() => {
                setHistory(prev => [...prev, outcomeValues.join(' ')]);
                const outputText = result.output.join('\n');
                if (outputText) {  // Only set text if there's actual output
                    setText(outputText);
                    setIsSystemTyping(true);
                }
                setOutcome([]);
            }, 8000);
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setText(errorMessage);
        setIsSystemTyping(true);
    } finally {
        setIsSpinning(false);
    }
  }, [onUserInput, numbers, setText, setIsSystemTyping, setOutcome, setIsSpinning, setHistory]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
        e.stopPropagation();
      if (!isSystemTyping) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault(); 
          setHistory([]);
          return;
        }
        if (e.key === 'ArrowUp') {
            if (inputHistory[inputHistoryIndex + 1]) {
                setUserInput(inputHistory[inputHistoryIndex + 1]);
                setInputHistoryIndex(prev => prev + 1);
            }
          return;
        }
        if (e.key === 'ArrowDown') {
            if (inputHistory[inputHistoryIndex - 1]) {
                setUserInput(inputHistory[inputHistoryIndex - 1]);
                setInputHistoryIndex(prev => prev - 1);
            } else {
                setUserInput('');
                setInputHistoryIndex(-1);
            }
          return;
        }
        if (e.key === 'Enter') {
          setHistory(prev => [...prev, `>${userInput}`]);
          if (userInput) {
            setInputHistory(prev => [userInput, ...prev]);
          }
          setInputHistoryIndex(-1);
          setUserInput('');
          handleInput(userInput);
        } else if (e.key === 'Backspace') {
          setUserInput(prev => prev.slice(0, -1));
        } else if (e.key.length === 1) {  // Single character keys only
          setUserInput(prev => prev + e.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isSystemTyping, userInput, handleInput, inputHistory, inputHistoryIndex]);

  return (
    <Container ref={containerRef}>
        
        <div className={styles.history}>
            {history.map((input, index) => (
                <pre key={index} className={styles.pre}>
                    {input}
                </pre>
            ))}
        </div>

        {!isSystemTyping && !isSpinning && outcome.length === 0 && (
            <div className={styles.inputLine}>
                <div className={styles.inputText}>{`> ${userInput}`.replace(/ /g, '\u00A0')}</div>
                <Cursor>█</Cursor>
            </div>
        )}
        {isSystemTyping && (
            <div onClick={() => setRerenderKey(rerenderKey + 1)}>
                <TerminalOutput text={text} key={rerenderKey} setIsSystemTyping={setIsSystemTyping} />
            </div>
        )}
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
    </Container>
  );
}; 