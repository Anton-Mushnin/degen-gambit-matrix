import React from 'react';
import { GuessNumbers } from './GuessNumbers';
import styles from './GuessNumbers.module.css';

interface GuessNextNumberOutcomeComponentProps {
  outcome?: any[];
}

const GuessNextNumberOutcomeComponent: React.FC<GuessNextNumberOutcomeComponentProps> = ({ outcome }) => {
  if (!outcome || outcome.length === 0) return null;

  // GuessNextNumber outcome structure: the result number is typically the first element
  const guessResult = outcome[0]?.toString() ?? '1';

  return (
    <div className={styles.spinningContainer}>
      <GuessNumbers result={guessResult} duration={2000} />
    </div>
  );
};

export default GuessNextNumberOutcomeComponent;

