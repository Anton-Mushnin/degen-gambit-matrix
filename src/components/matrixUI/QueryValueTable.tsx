import styles from './QueryValueTable.module.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';

/**
 * QueryValueTable - A reusable component for displaying data in a table format
 * 
 * Usage example:
 * ```tsx
 * import QueryValueTable from '../components/matrixUI/QueryValueTable';
 * 
 * // Basic usage
 * <QueryValueTable
 *   label="Game Statistics"
 *   headers={['Number', 'Occurrences', 'Bets', 'Wins', 'Win Rate']}
 *   queryKey={['statistics', contractAddress]}
 *   queryFn={() => getTableData(contractAddress, publicClient)}
 * />
 * 
 * // With all optional features
 * <QueryValueTable
 *   label="Live Game Data"
 *   headers={['Player', 'Bet', 'Result', 'Payout']}
 *   queryKey={['gameData', gameId]}
 *   queryFn={() => fetchGameData(gameId)}
 *   refetchInterval={3000}
 *   blinkOnUpdate={true}
 *   onDataUpdate={(data) => {
 *     console.log('Table updated with', data.length, 'rows');
 *     // Handle data updates, trigger effects, etc.
 *   }}
 * />
 * ```
 */

interface QueryValueTableProps {
  label: string;
  headers: string[];
  queryKey: string[];
  queryFn: () => Promise<string[][]>;
  refetchInterval?: number;
  animation?: boolean;
  onDataUpdate?: (data: string[][]) => void;
  blinkOnUpdate?: boolean;
}

const QueryValueTable = ({ 
  label, 
  headers,
  queryKey, 
  queryFn, 
  refetchInterval,
  onDataUpdate,
  blinkOnUpdate = false
}: QueryValueTableProps) => {
  const { data, refetch } = useQuery({
    queryKey,
    queryFn,
    refetchInterval,
  });

  const [displayData, setDisplayData] = useState<string[][]>([]);
  const [isUpdated, setIsUpdated] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Check if data actually changed
      const dataChanged = JSON.stringify(data) !== JSON.stringify(displayData);
      
      if (dataChanged && blinkOnUpdate && displayData.length > 0) {
        setIsUpdated(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setIsUpdated(false);
        }, 1500) as unknown as number;
      }
      
      setDisplayData(data);
      if (onDataUpdate) {
        onDataUpdate(data);
      }
    }
  }, [data, onDataUpdate, blinkOnUpdate, displayData]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => refetch()}>
        {label}
      </div>
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          {headers.map((header, index) => (
            <div key={index} className={styles.headerCell}>{header}</div>
          ))}
        </div>
        {displayData.length > 0 && displayData.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.tableRow}>
            {Array.isArray(row) && row.map((cell, cellIndex) => (
              <div key={cellIndex} className={isUpdated && blinkOnUpdate ? styles.blink : styles.cell}>{cell}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueryValueTable;
