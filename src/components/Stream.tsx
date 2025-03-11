import { useEffect, useState } from 'react';
import { watchContractEvent } from '@wagmi/core';
import { contractAddress } from '../config';
import { degenGambitABI } from '../ABIs/DegenGambit.abi.ts';
import { wagmiConfig } from '../config';
import { formatEther } from 'viem';
import styles from './Stream.module.css';
import { useDegenGambitInfo } from '../hooks/useDegenGambitInfo';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveAccount } from 'thirdweb/react';

interface ContractEvent {
  player: string;
  bonus?: boolean;
  blockNumber: number;
  eventType: 'spin' | 'accept' | 'respin';
  description: string;
}

const Stream: React.FC = () => {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const activeAccount = useActiveAccount()
  const contractInfo = useDegenGambitInfo(contractAddress);
  const queryClient = useQueryClient()

  useEffect(() => {
    const unwatchSpin = watchContractEvent(wagmiConfig, {
      address: contractAddress,
      abi: degenGambitABI,
      eventName: 'Spin',
      onLogs: (logs) => {
        
        queryClient.invalidateQueries({ queryKey: ['contractBalance'] });
        if (logs.some((log) => log.args.player === activeAccount?.address)) {
          queryClient.invalidateQueries({queryKey: ['accountBalance']});
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
                const description = `${player.slice(0, 6)}...${player?.slice(-4)} uploads ${costToSpinFormatted}${bonus ? ' and 1 GAMBIT' : ''}`;
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
        queryClient.invalidateQueries({queryKey: ['gambitSupply']})
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

    return () => {
      unwatchSpin();
      unwatchAccept();
    };
  }, [contractInfo.data]);

  return (
      <div className={styles.container}>
        {events.map((event, index) => (
          <div key={index} className={styles.event}>
            {event.description}
          </div>
        ))}
      </div>
  );
};

export default Stream;