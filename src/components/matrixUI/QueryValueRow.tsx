import styles from './ValueRow.module.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';


const BLINK_INTERVAL = 1500;

interface QueryValueRowProps {
  label: string
  queryKey: string[]
  queryFn: () => Promise<{
    formatted: string
    value: bigint
    decimals: number
  } | null>
  refetchInterval?: number
  animation?: boolean
  onDataUpdate?: (data: any) => void
  blinkOnUpdate?: boolean
}

const QueryValueRow = ({ queryKey, label, queryFn, refetchInterval, animation = true, onDataUpdate, blinkOnUpdate = false }: QueryValueRowProps) => {
    const {data: _data, refetch} = useQuery({
        queryKey, 
        queryFn, 
        refetchInterval,
    });
    const [data, setData] = useState<{formatted: string, value: bigint} | undefined>(undefined)
    const [isUpdated, setIsUpdated] = useState(false)
    const animationFrameRef = useRef<number | null>(null)
    const animationTimeoutRef = useRef<any | null>(null)
    const animationStartTimeRef = useRef<number>(0)
    const animationDurationRef = useRef<number>(3000) // 3 seconds animation duration

    // Clean up any running animations
    const cleanupAnimations = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        if (!_data) return;
        if (!animation) {
            setData(_data);
            return;
        }

        // Initial data setup
        if (!data) {
            setData(_data);
            return;
        }

        // Don't animate if values are the same
        if (_data.value === data.value) return;

        setIsUpdated(true);
        cleanupAnimations();

        animationTimeoutRef.current = setTimeout(() => {
            setIsUpdated(false);
            const startValue = data.value;
            const endValue = _data.value;
            const totalDelta = endValue - startValue;
            animationStartTimeRef.current = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - animationStartTimeRef.current;
                const progress = Math.min(elapsed / animationDurationRef.current, 1);

                if (progress < 1) {
                    const currentValue = startValue + (totalDelta * BigInt(Math.floor(progress * 100))) / BigInt(100);
                    setData({
                        formatted: formatUnits(currentValue, _data.decimals ?? 18),
                        value: currentValue
                    });
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    setData(_data);
                    cleanupAnimations();
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
        }, blinkOnUpdate ? BLINK_INTERVAL : 0);

        return cleanupAnimations;
    }, [_data, animation, blinkOnUpdate]);

    useEffect(() => {
        if (onDataUpdate) {
            onDataUpdate(_data);
        }
    }, [_data]);

    // Cleanup on unmount
    useEffect(() => cleanupAnimations, []);

    return (
        <div className={styles.container}>
            <div className={styles.item} onClick={() => refetch()}>{label}</div>
            <div className={isUpdated && blinkOnUpdate ? styles.blink : styles.item}>{data?.formatted}</div>
        </div>
    );
}

export default QueryValueRow; 