import { useEffect, useState, useRef } from "react";
import styles from './MatrixTerminal.module.css';



const RandomNumbers = ({result, duration}: {result?: string, duration?: number}) => {
    const [text, setText] = useState('');
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (result && duration) {
            timer = setTimeout(() => {
            setText(result); 
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
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
            <pre className={styles.pre}>
                {text}
            </pre>
    )
}

export default RandomNumbers;