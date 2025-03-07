import { useState, useEffect } from 'react';
import styled from 'styled-components';
import styles from './MatrixTerminal.module.css';

const color = '#a1eeb5';
const glow = '#0dda9f';

const TerminalContainer = styled.div`
  background-color: transparent;
  color: ${color};
  font-family: 'NimbusMono', 'Courier New', Courier, monospace;
  overflow-y: auto;
  text-shadow: 0 0 15px ${glow};
`;

interface MatrixTerminalProps {
  text: string
  typingSpeed?: number;
  setIsSystemTyping: (isSystemTyping: boolean) => void;
}

export const TerminalOutput = ({ text, typingSpeed = 20, setIsSystemTyping }: MatrixTerminalProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset state when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      setIsSystemTyping(true);
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, Math.max(10, typingSpeed - 30 * (text.length / 500)));

      return () => clearTimeout(timer);
    } else {
      setIsSystemTyping(false);
    }
  }, [currentIndex, text, typingSpeed, setIsSystemTyping]);

  return (
    <TerminalContainer>
      <pre className={styles.pre}>
        {displayedText}
      </pre>
    </TerminalContainer>
  );
}; 