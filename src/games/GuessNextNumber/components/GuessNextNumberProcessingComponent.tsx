import { GuessNumbers } from './GuessNumbers';
import styles from './GuessNextNumberProcessingComponent.module.css';

export const GuessNextNumberProcessingComponent = ({ 
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
      <GuessNumbers result={result} duration={duration} />
    </div>
  );
};

