import { thirdwebClientId, thirdWebG7Testnet } from '../config';
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { createThirdwebClient } from 'thirdweb';
import { useActiveAccount, useActiveWallet, useConnectModal } from 'thirdweb/react';
import { TerminalOutput } from './TerminalOutput';
import styles from './MatrixTerminal.module.css';
import RandomNumbers from './RandomNumbers';


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
  statusBar?: string; // Optional status bar text to show at the bottom
}



export const MatrixTerminal = ({ onUserInput, numbers, statusBar }: MatrixTerminalProps) => {
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
    if (activeAccount) {
        setText(`Wake up, ${activeAccount.address}`);
        setIsSystemTyping(true);
    }
  }, [activeAccount]);

  useEffect(() => {
    if (activeWallet) {
      const chain = activeWallet.getChain();
      if (chain?.id !== thirdWebG7Testnet.id) {
        activeWallet.switchChain(thirdWebG7Testnet as any)
      }
    }
  }, [activeWallet]);



  useEffect(() => {

    if (!isSystemTyping) {
      setHistory(prev => [...prev, text]);
    } else {

    }
  }, [isSystemTyping]);


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
  }, [isSystemTyping, userInput, onUserInput]);


  const handleInput = async (input: string) => {
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
            setText(result.output.join('\n'));
            setIsSystemTyping(true);
        } else if (result?.outcome) {
            const _outcome = result.outcome.map(item => numbers[Number(item)].toString());
            setOutcome(_outcome);
            setTimeout(() => {
                setHistory(prev => [...prev, _outcome.join(' ')]);
                setText(result.output.join('\n'));
                setIsSystemTyping(true);
                setOutcome([]);
            }, 8000);
        }
    } catch (e: any) {
        setText(e.message)
        setIsSystemTyping(true);
    } finally {
        setIsSpinning(false);
    }
  }



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
        
        {/* Status bar at the bottom of the screen */}
        {statusBar && (
            <div className={styles.statusBar}>
                {statusBar}
            </div>
        )}
    </Container>
  );
}; 