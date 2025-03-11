import styles from './Row.module.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

const Row = ({queryKey, label, queryFn}: {queryKey: string[], label: string, queryFn: () => Promise<{formatted: string, value: bigint}>}) => {
    const {data: _data, refetch} = useQuery({queryKey, queryFn});
    const [data, setData] = useState<{formatted: string, value: bigint} | undefined>(undefined)
    const [isUpdated, setIsUpdated] = useState(false)
    const intervalRef = useRef<any| null>(null)

    useEffect(() => {
        if (_data && data) {
            setIsUpdated(true)
            setTimeout(() => {
                setIsUpdated(false)
                const numberOfSteps: bigint = BigInt(20);
                const delta = _data.value - data.value;
                const step = delta / numberOfSteps;
                const interval = setInterval(() => {
                    if (data.value !== _data.value) {
                        setData(prev => ({formatted: (Number(prev?.formatted) + Number(step)).toString(), value: prev?.value ?? BigInt(0) + step}))
                    } else {
                        setData({formatted: _data.formatted, value: _data.value})
                    }
                }, 100)
                intervalRef.current = interval
            }, 3000)
        } else {
            setData({formatted: _data?.formatted || '', value: _data?.value || BigInt(0)})
        }
    }, [_data])
    
    useEffect(() => {
        if (data?.formatted === _data?.formatted) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [data])

    return (
        <div className={styles.container}>
            <div className={styles.item} onClick={() => refetch()}>{label}</div>
            <div className={isUpdated ? styles.blink : styles.item}>{data?.formatted}</div>
        </div>
    );
}

export default Row;