import React from 'react';
import { DiceNumbers } from './DiceNumbers';
import styles from './DiceNumbers.module.css';

interface DiceStreakOutcomeComponentProps {
  outcome?: any[];
}

const DiceStreakOutcomeComponent: React.FC<DiceStreakOutcomeComponentProps> = ({ outcome }) => {
  if (!outcome || outcome.length === 0) return null;
  console.log('outcome', outcome);

  // DiceStreak outcome structure: the dice roll result is typically the first element
  // Based on the contract and handlers, outcome should contain the dice result
  const diceResult = outcome[0]?.toString() ?? '2';

  return (
    <div className={styles.spinningContainer}>
      <DiceNumbers result={diceResult} duration={3000} />
    </div>
  );
};

export default DiceStreakOutcomeComponent;