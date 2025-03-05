
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import styles from './MatrixTerminal.module.css';

const color = '#a1eeb5';
const glow = '#0dda9f';

const TerminalContainer = styled.div`
  background-color: transparent;
  color: ${color};
  font-family: 'Courier New', Courier, monospace;
  overflow-y: auto;
  text-shadow: 0 0 10px ${glow};
`;


interface MatrixTerminalProps {
  text: string
  typingSpeed?: number;
  setIsSystemTyping: (isSystemTyping: boolean) => void;
}





export const TerminalOutput = ({ text, typingSpeed = 50, setIsSystemTyping }: MatrixTerminalProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);



  useEffect(() => {
    if (currentIndex < text.length) {
      setIsSystemTyping(true);
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typingSpeed - 20 * (text.length / 500));

      return () => clearTimeout(timer);
    } else {
      setIsSystemTyping(false);
    }
  }, [currentIndex, text, typingSpeed]);


  return (
    <TerminalContainer>
      <pre className={styles.pre}>
        {displayedText}
      </pre>
    </TerminalContainer>
  );
}; 