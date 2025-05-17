import { useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import styles from './ValueRow.module.css';

interface ValueRowProps {
  label: string
  data: {
    formatted: string
    value: bigint
    decimals: number
  } | null
  animation?: boolean
  blinkOnUpdate?: boolean
}

const ValueRow = ({ label, data: _data, animation = true, blinkOnUpdate = false }: ValueRowProps) => {
    const [data, setData] = useState<{formatted: string, value: bigint} | undefined>(undefined)
    const [isUpdated, setIsUpdated] = useState(false)
    const intervalRef = useRef<any| null>(null)
    const animationTimeoutRef = useRef<any | null>(null)

    // Clean up any running animations
    const cleanupAnimations = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
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
            const numberOfSteps = 100;
            const startValue = data.value;
            const endValue = _data.value;
            const totalDelta = endValue - startValue;
            let currentStep = 0;

            intervalRef.current = setInterval(() => {
                currentStep++;
                
                if (currentStep >= numberOfSteps) {
                    setData(_data);
                    cleanupAnimations();
                    return;
                }

                const progress = currentStep / numberOfSteps;
                const currentValue = startValue + (totalDelta * BigInt(Math.floor(progress * 100))) / BigInt(100);
                
                setData({
                    formatted: formatUnits(currentValue, _data.decimals ?? 18),
                    value: currentValue
                });
            }, 30);
        }, blinkOnUpdate ? 2000 : 0);

        return cleanupAnimations;
    }, [_data, animation, blinkOnUpdate]);

    // Cleanup on unmount
    useEffect(() => cleanupAnimations, []);

    return (
        <div className={styles.container}>
            <div className={styles.item}>{label}</div>
            <div className={isUpdated && blinkOnUpdate ? styles.blink : styles.item}>{data?.formatted}</div>
        </div>
    );
}

export default ValueRow; 