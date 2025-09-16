import { formatEther, formatUnits } from 'viem';
import { EventConfig, StreamEvent } from '../../../components/GameStream';

export const degenGambitStreamConfig: EventConfig[] = [
  {
    eventName: 'Spin',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['contractBalance']];
      
      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['accountBalance'], ['costToSpin'], ['lastSpinBlock'], ['currentBlock'], ['blocksLeft']);
      }
      
      if (logs.some((log: any) => log.args.bonus)) {
        queries.push(['gambitSupply']);
        if (logs.some((log: any) => log.args.bonus && log.args.player === activeAccount)) {
          queries.push(['accountGambitBalance']);
        }
      }
      
      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];
      
      logs.forEach((log: any) => {
        if (log.args.player) {
          const { player, bonus, value } = log.args;
          const description = `${player.slice(0, 6)}...${player?.slice(-4)} uploads ${value} WEI${bonus ? ' and burns 1 GAMBIT' : ''}`;
          
          events.push({
            player,
            description,
            blockNumber: Number(log.blockNumber),
            eventType: 'spin',
            transactionHash: log.transactionHash,
            logIndex: log.logIndex
          });
        }
      });
      
      return events;
    }
  },
  {
    eventName: 'Award',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [];
      const gambitAwarded = logs.some((log: any) => log.args.value && formatUnits(log.args.value, 18) === '1');
      const ethAwarded = logs.some((log: any) => log.args.value && formatUnits(log.args.value, 18) !== '1');
      
      if (gambitAwarded) {
        queries.push(['gambitSupply']);
      }
      if (ethAwarded) {
        queries.push(['contractBalance']);
      }
      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['accountGambitBalance'], ['accountBalance']);
      }
      
      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];
      
      logs.forEach((log: any) => {
        const { player, value } = log.args;
        if (!player || !value) return;
        
        const ethValue = formatEther(value);
        const valueFormatted = ethValue === '1' ? `${ethValue} [GAMBIT]` : `${ethValue} WEI [TG7T]`;
        const description = `${player.slice(0, 6)}...${player?.slice(-4)} awarded ${valueFormatted}`;
        
        events.push({
          player,
          description,
          blockNumber: Number(log.blockNumber),
          eventType: 'accept',
          transactionHash: log.transactionHash,
          logIndex: log.logIndex
        });
      });
      
      return events;
    }
  },
  {
    eventName: 'DailyStreak',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['gambitSupply']];
      
      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['accountGambitBalance']);
      }
      
      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];
      
      logs.forEach((log: any) => {
        const { player } = log.args;
        if (!player) return;
        
        const description = `${player.slice(0, 6)}...${player?.slice(-4)} claimed daily streak`;
        
        events.push({
          player,
          description,
          blockNumber: Number(log.blockNumber),
          eventType: 'dailyStreak',
          transactionHash: log.transactionHash,
          logIndex: log.logIndex
        });
      });
      
      return events;
    }
  },
  {
    eventName: 'WeeklyStreak',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['gambitSupply']];
      
      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['accountGambitBalance']);
      }
      
      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];
      
      logs.forEach((log: any) => {
        const { player } = log.args;
        if (!player) return;
        
        const description = `${player.slice(0, 6)}...${player?.slice(-4)} claimed weekly streak`;
        
        events.push({
          player,
          description,
          blockNumber: Number(log.blockNumber),
          eventType: 'weeklyStreak',
          transactionHash: log.transactionHash,
          logIndex: log.logIndex
        });
      });
      
      return events;
    }
  }
]; 