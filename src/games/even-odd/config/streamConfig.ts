import { EventConfig, StreamEvent } from '../../../components/GameStream';

export const evenOddStreamConfig: EventConfig[] = [
  {
    eventName: 'BetCommitted',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['contractBalance']];
      
      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['playerBalance', activeAccount!], ['gameStatus', activeAccount!]);
      }
      
      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];
      
      logs.forEach((log: any) => {
        const { player, choice, revealBlock, isFreeSpin } = log.args;
        if (!player) return;
        
        const choiceText = choice ? 'odd' : 'even';
        const spinType = isFreeSpin ? 'FREE SPIN' : 'bet';
        const description = `${player.slice(0, 6)}...${player?.slice(-4)} commits ${spinType} on ${choiceText} (reveal block ${revealBlock})`;
        
        events.push({
          player,
          description,
          blockNumber: Number(log.blockNumber),
          eventType: 'betCommitted',
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          choice,
          revealBlock,
          isFreeSpin
        });
      });
      
      return events;
    }
  },
  {
    eventName: 'BetResult',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['contractBalance']];
      
      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['playerBalance', activeAccount!], ['gameStatus', activeAccount!], ['lastResult', activeAccount!]);
      }
      
      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];
      
      logs.forEach((log: any) => {
        const { player, number, won, isFreeSpin } = log.args;
        if (!player || number === undefined || won === undefined) return;
        
        const numberText = number % 2 === 0 ? 'even' : 'odd';
        const resultText = won ? 'wins!' : 'loses.';
        const spinType = isFreeSpin ? 'FREE SPIN ' : '';
        const amount = won ? '+1400 WEI' : '-1000 WEI';
        const description = `${player.slice(0, 6)}...${player?.slice(-4)} ${spinType}${resultText} Number ${number} is ${numberText}. ${won ? amount : ''}`;
        
        events.push({
          player,
          description,
          blockNumber: Number(log.blockNumber),
          eventType: 'result',
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          number,
          won,
          isFreeSpin
        });
      });
      
      return events;
    }
  },
  {
    eventName: 'FreeSpin',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [];
      
      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['gameStatus', activeAccount!]);
      }
      
      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];
      
      logs.forEach((log: any) => {
        const { player, choice } = log.args;
        if (!player) return;
        
        const choiceText = choice ? 'odd' : 'even';
        const description = `${player.slice(0, 6)}...${player?.slice(-4)} activates free spin on ${choiceText}`;
        
        events.push({
          player,
          description,
          blockNumber: Number(log.blockNumber),
          eventType: 'freeSpin',
          transactionHash: log.transactionHash,
          logIndex: log.logIndex,
          choice
        });
      });
      
      return events;
    }
  }
]; 