import { useState, useEffect, useRef } from 'react';
import styles from './DiceNumbers.module.css';

// Create a dice-specific random number component
export const DiceNumbers = ({ result, duration }: { result?: string, duration?: number }) => {
  const [text, setText] = useState('');
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (result && duration) {
      timer = setTimeout(() => {
        setText(result);
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      }, duration);
    }

    intervalIdRef.current = setInterval(() => {
      const randomDice = Math.floor(1 + Math.random() * 6);
      setText(randomDice.toString());
    }, 100);

    return () => {
      if (timer) clearTimeout(timer);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [result, duration]);

  return (
    <pre className={styles.diceNumber}>
      {text}
    </pre>
  );
};
