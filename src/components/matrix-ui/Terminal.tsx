import { useState, useEffect, useRef } from 'react';
import { TerminalOutput } from '../TerminalOutput';
import styles from '../MatrixTerminal.module.css';

interface TerminalProps {
    newText: {
        text: string;
        setText: (text: string) => void;
        toType: boolean;
    }
    onSubmit: (input: string) => void;  // Handler for user input
    isProcessing: boolean;          // Whether terminal is processing input
    children?: React.ReactNode; 
}

export const Terminal = ({ newText, onSubmit, isProcessing, children }: TerminalProps) => {
  const [userInput, setUserInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [inputHistoryIndex, setInputHistoryIndex] = useState(-1);

  const [isSystemTyping, setIsSystemTyping] = useState(true);
  const [text, setText] = useState(newText.text);

  const [rerenderKey, setRerenderKey] = useState(0);

  // Add ref for the container
  const containerRef = useRef<HTMLDivElement>(null);


  // Add scroll to bottom effect when history changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history, isSystemTyping, isProcessing, children]);


  useEffect(() => {
    console.log('newText', newText);
    if (!newText.text) {
        return;
    }
    if (newText.toType) {
      setText(newText.text);
    } else {
      setHistory(prev => [...prev, newText.text]);
    }
  }, [newText]);


  useEffect(() => {
    if (!isSystemTyping && text) {
      setHistory(prev => [...prev, text]);
      // Clear the text after adding it to history to prevent re-adding
      setText('');
      newText.setText('');
    }
  }, [isSystemTyping, text]);

  const handleInput = async (input: string) => {
    if (input === 'clear') {
      setHistory([]);
      return;
    }
    onSubmit(input);
  };

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
            e.preventDefault();
            if (inputHistory[inputHistoryIndex + 1]) {
                setUserInput(inputHistory[inputHistoryIndex + 1]);
                setInputHistoryIndex(prev => prev + 1);
            }
          return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
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
    <div className={styles.container} ref={containerRef}>
        <div className={styles.history}>
            {history.map((input, index) => (
                <pre key={index} className={styles.pre}>
                    {input}
                </pre>
            ))}
        </div>

        {!isSystemTyping && !isProcessing && (
            <div className={styles.inputLine}>
                <div className={styles.inputText}>{`>${userInput}`.replace(/ /g, '\u00A0')}</div>
                <span className={styles.cursor}>█</span>
            </div>
        )}
        {isSystemTyping && (
            <div onClick={() => setRerenderKey(rerenderKey + 1)}>
                <TerminalOutput text={text} key={rerenderKey} setIsSystemTyping={setIsSystemTyping} />
            </div>
        )}
        {children}
    </div>
  );
}; 