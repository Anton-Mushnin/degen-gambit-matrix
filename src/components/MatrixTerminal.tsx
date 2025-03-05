import { thirdwebClientId } from '../config';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createThirdwebClient } from 'thirdweb';
import { useActiveAccount, useConnectModal } from 'thirdweb/react';
import { TerminalOutput } from './TerminalOutput';
import styles from './MatrixTerminal.module.css';


const color = '#a1eeb5';
const glow = '#0dda9f';


const Container = styled.div`
    background-color:rgb(15, 15, 15);
    font-family: 'Courier New', Courier, monospace;
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: start;
    height: 100vh;
    width: 100vw;
    padding: 40px;
    gap: 0px;
    color: ${color};
    text-shadow: 0 0 10px ${glow};
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
  onUserInput?: (input: string) => Promise<string[]>;
}



export const MatrixTerminal = ({ onUserInput }: MatrixTerminalProps) => {
  const [userInput, setUserInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const [isSystemTyping, setIsSystemTyping] = useState(true);
  const { connect } = useConnectModal();
  const activeAccount = useActiveAccount();
  const client = createThirdwebClient({ clientId: thirdwebClientId });
  const [text, setText] = useState('');

  const [rerenderKey, setRerenderKey] = useState(0);

  useEffect(() => {
    if (!activeAccount) {
        connect({client});
    }
    if (activeAccount) {
        setText(`Knock, knock, ${activeAccount.address}`);
        setIsSystemTyping(true);
    }
  }, [activeAccount]);

  useEffect(() => {
    if (!isSystemTyping) {
      setHistory(prev => [...prev, text]);
    }
  }, [isSystemTyping]);


  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isSystemTyping) {
        if (e.key === 'Enter') {
          setHistory(prev => [...prev, userInput]);
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
    const result = await onUserInput?.(input);
    if (result) {
      setText(result.join('\n'));
      setIsSystemTyping(true);
    }
  }



  return (
    <Container >
        <div className={styles.history}>
            {history.map((input, index) => (
                <pre key={index} className={styles.pre}>
                    {input}
                </pre>
            ))}
        </div>

        {!isSystemTyping ? (
            <div className={styles.inputLine}>
                <div className={styles.inputText}>{userInput}</div>
                <Cursor>█</Cursor>
            </div>
        ) : (
            <div onClick={() => setRerenderKey(rerenderKey + 1)}>
                <TerminalOutput text={text} key={rerenderKey} setIsSystemTyping={setIsSystemTyping} />
            </div>
        )}
    </Container>
  );
}; 