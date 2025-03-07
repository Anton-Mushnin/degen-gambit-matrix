import { useEffect, useState, useRef } from "react";
import styles from './MatrixTerminal.module.css';
import { numbers } from "../config/symbols";

interface RandomNumbersProps {
    result?: string;
    duration?: number;
}

const RandomNumbers = ({ result, duration }: RandomNumbersProps) => {
    const [text, setText] = useState('');
    const [animationClass, setAnimationClass] = useState('');
    const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        if (result && duration) {
            timer = setTimeout(() => {
                setText(result);
                if (intervalIdRef.current) clearInterval(intervalIdRef.current);
                
                // Determine if this is a major or minor symbol
                const resultNumber = parseInt(result);
                const symbolIndex = numbers.indexOf(resultNumber);
                
                // Last 3 symbols are major symbols (index 16, 17, 18)
                const isMajorSymbol = symbolIndex >= numbers.length - 3 && symbolIndex !== -1;
                const isMinorSymbol = symbolIndex > 0 && symbolIndex < numbers.length - 3;
                
                if (isMajorSymbol) {
                    // Apply both shake and blink for major symbols
                    setAnimationClass(styles.shakeBlink);
                } else if (isMinorSymbol) {
                    // Apply only shake for minor symbols
                    setAnimationClass(styles.shake);
                }
                
                // Remove animation class after animation completes
                const animationTimeout = setTimeout(() => {
                    setAnimationClass('');
                }, 1000); // Slightly longer than the animation duration
                
                return () => clearTimeout(animationTimeout);
            }, duration);
        }
        
        intervalIdRef.current = setInterval(() => {
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            setText(randomNum.toString());
        }, 50); 
        
        return () => {
            if (timer) clearTimeout(timer);
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        };
    }, [result, duration]);

    return (
        <pre className={`${styles.pre} ${animationClass}`}>
            {text}
        </pre>
    );
};

export default RandomNumbers;