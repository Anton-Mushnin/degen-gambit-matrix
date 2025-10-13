import { DiceNumbers } from './DiceNumbers';
import styles from './DiceStreakProcessingComponent.module.css';

export const DiceStreakProcessingComponent = ({ 
  isProcessing, 
  result, 
  duration 
}: { 
  isProcessing?: boolean;
  result?: string;
  duration?: number;
}) => {
  if (!isProcessing) return null;

  return (
    <div className={styles.processingContainer}>
      <DiceNumbers result={result} duration={duration} />
    </div>
  );
};
