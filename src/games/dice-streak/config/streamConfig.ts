import { formatEther } from 'viem';
import { EventConfig, StreamEvent } from '../../../components/GameStream';

export const diceStreakStreamConfig: EventConfig[] = [
  {
    eventName: 'PlayerWin',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['bankBalance']];

      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['playerBalance'], ['playerTotalWinnings'], ['playerStreak'], ['gameStatus'], ['lastBetResult']);
      }

      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];
      
      logs.forEach((log: any) => {
        if (log.args.player) {
          const { player, guess, result, payout } = log.args;
          const description = `${player.slice(0, 6)}...${player?.slice(-4)} wins! Guess: ${guess}, Result: ${result}, Payout: ${formatEther(payout)} ETH`;
          
          events.push({
            player,
            description,
            blockNumber: Number(log.blockNumber),
            eventType: 'win',
            transactionHash: log.transactionHash,
            logIndex: log.logIndex
          });
        }
      });
      
      return events;
    }
  },
  {
    eventName: 'PlayerWinWithCombo',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['bankBalance'], ['bestCombo']];

      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['playerBalance'], ['playerTotalWinnings'], ['playerStreak'], ['gameStatus'], ['lastBetResult']);
      }

      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];
      
      logs.forEach((log: any) => {
        if (log.args.player) {
          const { player, guess, result, basePayout, bonusPayout, comboType } = log.args;
          const totalPayout = basePayout + bonusPayout;
          const description = `${player.slice(0, 6)}...${player?.slice(-4)} wins with ${comboType}! Guess: ${guess}, Result: ${result}, Base: ${formatEther(basePayout)} ETH + Bonus: ${formatEther(bonusPayout)} ETH = ${formatEther(totalPayout)} ETH`;
          
          events.push({
            player,
            description,
            blockNumber: Number(log.blockNumber),
            eventType: 'combo_win',
            transactionHash: log.transactionHash,
            logIndex: log.logIndex
          });
        }
      });
      
      return events;
    }
  },
  {
    eventName: 'Spin',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['bankBalance'], ['allStatistics']];

      // if (logs.some((log: any) => log.args.player === activeAccount)) {
      //   queries.push(['playerBalance'], ['gameStatus'], ['comboPossibility'], ['playerStreak'], ['lastBetResult']);
      // }
      return queries;
    },
    processLogs: (_logs: any[]) => {
      // No display needed for Spin events, just return empty array
      return [];
    }
  }
];
