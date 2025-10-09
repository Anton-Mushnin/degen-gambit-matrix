import { formatEtherOrWei } from '../../../utils/formatting';
import { EventConfig, StreamEvent } from '../../../components/GameStream';

export const diceRunStreamConfig: EventConfig[] = [
  {
    eventName: 'BetPlaced',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['bankBalance'], ['diceStatistics']];

      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['playerBalance'], ['playerTotalWinnings'], ['playerCurrentStreak'], ['nextNeededDiceNumber'], ['potentialBonusAmount']);
      }

      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];

      logs.forEach((log: any) => {
        if (log.args.player) {
          const { player, numberChosen, betAmount } = log.args;
          const description = `${player.slice(0, 6)}...${player?.slice(-4)} bets ${formatEtherOrWei(betAmount, 0.00001).formatted} on number ${numberChosen}`;

          events.push({
            player,
            description,
            blockNumber: Number(log.blockNumber),
            eventType: 'bet',
            transactionHash: log.transactionHash,
            logIndex: log.logIndex
          });
        }
      });

      return events;
    }
  },
  {
    eventName: 'PlayerWin',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['bankBalance'], ['diceStatistics']];

      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['playerBalance'], ['playerTotalWinnings'], ['playerCurrentStreak'], ['nextNeededDiceNumber'], ['potentialBonusAmount']);
      }

      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];

      logs.forEach((log: any) => {
        if (log.args.player) {
          const { player, diceRolled, payoutAmount } = log.args;
          const description = `${player.slice(0, 6)}...${player?.slice(-4)} wins ${formatEtherOrWei(payoutAmount, 0.00001).formatted}! Rolled: ${diceRolled}`;

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
    eventName: 'PlayerWinWithStreak',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['bankBalance'], ['bestStreak'], ['diceStatistics']];

      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['playerBalance'], ['playerTotalWinnings'], ['playerCurrentStreak'], ['nextNeededDiceNumber'], ['potentialBonusAmount']);
      }

      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];

      logs.forEach((log: any) => {
        if (log.args.player) {
          const { player, streakLength, bonusAmount } = log.args;
          const description = `${player.slice(0, 6)}...${player?.slice(-4)} wins streak bonus of ${formatEtherOrWei(bonusAmount, 0.00001).formatted}! Streak: ${streakLength}`;

          events.push({
            player,
            description,
            blockNumber: Number(log.blockNumber),
            eventType: 'streak_win',
            transactionHash: log.transactionHash,
            logIndex: log.logIndex
          });
        }
      });

      return events;
    }
  },
  {
    eventName: 'Investment',
    invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
      const queries: string[][] = [['bankBalance'], ['streakBankSharePercentages']];

      if (logs.some((log: any) => log.args.player === activeAccount)) {
        queries.push(['playerBalance'], ['amountInvested'], ['sharePercentage'], ['shareChange']);
      }

      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];

      logs.forEach((log: any) => {
        if (log.args.player) {
          const { player, investmentAmount, newSharePercentage } = log.args;
          const description = `${player.slice(0, 6)}...${player?.slice(-4)} invests ${formatEtherOrWei(investmentAmount, 0.00001).formatted}, new share: ${newSharePercentage}%`;

          events.push({
            player,
            description,
            blockNumber: Number(log.blockNumber),
            eventType: 'investment',
            transactionHash: log.transactionHash,
            logIndex: log.logIndex
          });
        }
      });

      return events;
    }
  },
  {
    eventName: 'NewBestStreak',
    invalidateQueries: (_logs: any[], _activeAccount: string | undefined) => {
      const queries: string[][] = [['bestStreak']];

      return queries;
    },
    processLogs: (logs: any[]) => {
      const events: StreamEvent[] = [];

      logs.forEach((log: any) => {
        if (log.args.player) {
          const { player, newStreakLength } = log.args;
          const description = `${player.slice(0, 6)}...${player?.slice(-4)} breaks best streak record! New record: ${newStreakLength}`;

          events.push({
            player,
            description,
            blockNumber: Number(log.blockNumber),
            eventType: 'record',
            transactionHash: log.transactionHash,
            logIndex: log.logIndex
          });
        }
      });

      return events;
    }
  }
];
