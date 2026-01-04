import { useState, useEffect, useRef } from 'react';
import styles from './GuessNumbers.module.css';

// Create a number animation component for guessing game
export const GuessNumbers = ({ result, duration }: { result?: string, duration?: number }) => {
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
      const randomNumber = Math.floor(1 + Math.random() * 6);
      setText(randomNumber.toString());
    }, 100);

    return () => {
      if (timer) clearTimeout(timer);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [result, duration]);

  return (
    <pre className={styles.guessNumber}>
      {text}
    </pre>
  );
};

