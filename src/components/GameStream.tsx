import { useEffect, useRef, useState } from 'react';
import { watchContractEvent } from '@wagmi/core';
import { wagmiConfig } from '../config/index.ts';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveAccount } from 'thirdweb/react';
import { degenGambitGame } from '../games/degen-gambit/index.ts';

export interface StreamEvent {
  player: string;
  blockNumber: number;
  eventType: string;
  description: string;
  transactionHash: string;
  logIndex: number;
  [key: string]: any; // Allow additional properties
}

export interface EventConfig {
  eventName: string;
  processLogs: (logs: any[], activeAccount: string | undefined) => StreamEvent[];
  invalidateQueries: (logs: any[], activeAccount: string | undefined) => string[][];
}

export interface GameStreamProps {
  contractAddress: string;
  abi: any;
  eventConfigs: EventConfig[];
  className?: string;
}

const GameStream: React.FC<GameStreamProps> = ({
  contractAddress,
  abi,
  eventConfigs,
  className = ''
}) => {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const activeAccount = useActiveAccount();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to check if event already exists
  const isEventDuplicate = (newEvent: StreamEvent, existingEvents: StreamEvent[]) => {
    return existingEvents.some(
      event => 
        event.transactionHash === newEvent.transactionHash && 
        event.logIndex === newEvent.logIndex
    );
  };

  // Helper function to add event if not duplicate
  const addEventIfUnique = (newEvent: StreamEvent) => {
    setEvents(prev => {
      if (isEventDuplicate(newEvent, prev)) {
        return prev;
      }
      return [...prev, newEvent];
    });
  };

  // Add scroll to bottom effect when history changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  useEffect(() => {
    const unwatchers: (() => void)[] = [];

    eventConfigs.forEach(config => {
      const unwatch = watchContractEvent(wagmiConfig, {
        address: contractAddress,
        chainId: degenGambitGame.network.id as any,
        abi,
        eventName: config.eventName,
        onLogs: (logs) => {
          // Invalidate queries
          const queriesToInvalidate = config.invalidateQueries(logs, activeAccount?.address);
          queriesToInvalidate.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey });
          });

          // Process events
          const newEvents = config.processLogs(logs, activeAccount?.address);
          newEvents.forEach(event => addEventIfUnique(event));
        },
      });
      unwatchers.push(unwatch);
    });

    return () => {
      unwatchers.forEach(unwatch => unwatch());
    };
  }, [contractAddress, abi, eventConfigs, activeAccount?.address, degenGambitGame.network.id]);

  return (
    <div className={className} ref={containerRef}>
      {events.map((event, index) => (
        <div key={index} className="event">
          {event.description}
        </div>
      ))}
    </div>
  );
};

export default GameStream; 