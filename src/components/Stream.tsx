import { useEffect, useRef, useState } from 'react';
import { watchContractEvent } from '@wagmi/core';
import { contractAddress } from '../config';
import { degenGambitABI } from '../ABIs/DegenGambit.abi.ts';
import { wagmiConfig } from '../config';
import { formatEther, formatUnits } from 'viem';
import styles from './Stream.module.css';
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveAccount } from 'thirdweb/react';

interface ContractEvent {
  player: string;
  bonus?: boolean;
  blockNumber: number;
  eventType: 'spin' | 'accept' | 'respin' | 'dailyStreak' | 'weeklyStreak';
  description: string;
}

const Stream: React.FC = () => {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const activeAccount = useActiveAccount()
  const contractInfo = useDegenGambitInfo(contractAddress);
  const queryClient = useQueryClient()

  const containerRef = useRef<HTMLDivElement>(null);

  // Add scroll to bottom effect when history changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  useEffect(() => {
    const unwatchSpin = watchContractEvent(wagmiConfig, {
      address: contractAddress,
      abi: degenGambitABI,
      eventName: 'Spin',
      onLogs: (logs) => {
        
        queryClient.invalidateQueries({ queryKey: ['contractBalance'] });
        if (logs.some((log) => log.args.player === activeAccount?.address)) {
          queryClient.invalidateQueries({queryKey: ['accountBalance']});
          queryClient.invalidateQueries({queryKey: ['costToSpin']});
          queryClient.invalidateQueries({queryKey: ['lastSpinBlock']});
          queryClient.invalidateQueries({queryKey: ['currentBlock']});
        }
        
        
        if (logs.some((log) => log.args.bonus)) {
          queryClient.invalidateQueries({queryKey: ['gambitSupply']});
          if (logs.some((log) => log.args.bonus && log.args.player === activeAccount?.address)) {
            queryClient.invalidateQueries({queryKey: ['accountGambitBalance']});  
          }
        }


        logs.forEach(log => {
            if (log.args.player) {
                const {player, bonus} = log.args;
                if (!contractInfo.data?.costToSpin || !contractInfo.data?.costToRespin) return;
                const costToSpinFormatted = `${Math.random() < 0.2 ? contractInfo.data.costToSpin : contractInfo.data.costToRespin}`;
                const description = `${player.slice(0, 6)}...${player?.slice(-4)} uploads ${costToSpinFormatted}${bonus ? ' and burns 1 GAMBIT' : ''}`;
                setEvents(prev => [...prev, {
                    player,
                    description,
                    bonus: bonus as boolean,
                    blockNumber: Number(log.blockNumber),
                    eventType: 'spin'
                }]);
            }
        });
      },
    });

    const unwatchAccept = watchContractEvent(wagmiConfig, {
      address: contractAddress,
      abi: degenGambitABI,
      eventName: 'Award',
      onLogs: (logs) => {
        const gambitAwarded = logs.some((log) => log.args.value && formatUnits(log.args.value, 18) === '1')
        const ethAwarded = logs.some((log) => log.args.value && formatUnits(log.args.value, 18) !== '1')
        if (gambitAwarded) {
          queryClient.invalidateQueries({queryKey: ['gambitSupply']})
        }
        if (ethAwarded) {
          queryClient.invalidateQueries({queryKey: ['contractBalance']});
        }
        if (logs.some((log) => log.args.player === activeAccount?.address)) {
          queryClient.invalidateQueries({queryKey: ['accountGambitBalance']});
        }
        if (logs.some((log) => log.args.player === activeAccount?.address)) {
          queryClient.invalidateQueries({queryKey: ['accountBalance']});
        }
        logs.forEach(log => {
            const {player, value} = log.args;
            if (!player || !value) return;
            const ethValue = formatEther(value);
            const valueFormatted = ethValue === '1' ? `${ethValue} [GAMBIT]` : `${ethValue} WEI [TG7T]`;
            const description = `${player.slice(0, 6)}...${player?.slice(-4)} awarded ${valueFormatted}`;
            setEvents(prev => [...prev, {
                player,
                description,
                blockNumber: Number(log.blockNumber),
                eventType: 'accept'
            }]);
        });
      },
    });

    const unwatchDailyStreak = watchContractEvent(wagmiConfig, {
      address: contractAddress,
      abi: degenGambitABI,
      eventName: 'DailyStreak',
      onLogs: (logs) => {
        queryClient.invalidateQueries({queryKey: ['gambitSupply']})
        if (logs.some((log) => log.args.player === activeAccount?.address)) {
          queryClient.invalidateQueries({queryKey: ['accountGambitBalance']});
        }
        logs.forEach(log => {
            const {player} = log.args;
            if (!player) return;
            const description = `${player.slice(0, 6)}...${player?.slice(-4)} claimed daily streak`;
            setEvents(prev => [...prev, {
                player,
                description,
                blockNumber: Number(log.blockNumber),
                eventType: 'dailyStreak'
            }]);
        });
      },
    });

    const unwatchWeeklyStreak = watchContractEvent(wagmiConfig, {
      address: contractAddress,
      abi: degenGambitABI,
      eventName: 'WeeklyStreak',
      onLogs: (logs) => {
        queryClient.invalidateQueries({queryKey: ['gambitSupply']})
        if (logs.some((log) => log.args.player === activeAccount?.address)) {
          queryClient.invalidateQueries({queryKey: ['accountGambitBalance']});
        }
        logs.forEach(log => {
            const {player} = log.args;
            if (!player) return;
            const description = `${player.slice(0, 6)}...${player?.slice(-4)} claimed weekly streak`;
            setEvents(prev => [...prev, {
                player,
                description,
                blockNumber: Number(log.blockNumber),
                eventType: 'weeklyStreak'
            }]);
        });
      },
    });

    return () => {
      unwatchSpin();
      unwatchAccept();
      unwatchDailyStreak();
      unwatchWeeklyStreak();
    };
  }, [contractInfo.data, activeAccount?.address]);

  return (
      <div className={styles.container} ref={containerRef}>
        {events.map((event, index) => (
          <div key={index} className={styles.event}>
            {event.description}
          </div>
        ))}
      </div>
  );
};

export default Stream;