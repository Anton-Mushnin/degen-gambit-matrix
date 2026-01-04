import { formatEther } from 'viem';
import { EventConfig, StreamEvent } from '../../../components/GameStream';

export const guessNextNumberStreamConfig: EventConfig[] = [
    {
        eventName: 'GuessCommitted',
        invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
            const queries: string[][] = [['numberStatistics']];

            if (logs.some((log: any) => log.args.player === activeAccount)) {
                queries.push(['playerBalance'], ['playerStatus']);
            }

            return queries;
        },
        processLogs: (logs: any[]) => {
            const events: StreamEvent[] = [];

            logs.forEach((log: any) => {
                if (log.args.player) {
                    const { player, guess } = log.args;
                    const description = `${player.slice(0, 6)}...${player?.slice(-4)} guesses ${guess}`;

                    events.push({
                        player,
                        description,
                        blockNumber: Number(log.blockNumber),
                        eventType: 'guess',
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
            const queries: string[][] = [
                ['bankBalance'],
                ['numberStatistics'],
                ['streakBonus3'],
                ['streakBonus4'],
                ['streakBonus5'],
                ['streakBonus6']
            ];

            if (logs.some((log: any) => log.args.player === activeAccount)) {
                queries.push(
                    ['playerBalance'],
                    ['playerStatus'],
                    ['playerStreak'],
                    ['playerTotalWinnings']
                );
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
        eventName: 'StreakBonus',
        invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
            const queries: string[][] = [
                ['bankBalance'],
                ['bestStreak'],
                ['streakBonus3'],
                ['streakBonus4'],
                ['streakBonus5'],
                ['streakBonus6']
            ];

            if (logs.some((log: any) => log.args.player === activeAccount)) {
                queries.push(
                    ['playerBalance'],
                    ['playerStreak'],
                    ['playerTotalWinnings']
                );
            }

            return queries;
        },
        processLogs: (logs: any[]) => {
            const events: StreamEvent[] = [];

            logs.forEach((log: any) => {
                if (log.args.player) {
                    const { player, streakLength, bonusAmount } = log.args;
                    const description = `${player.slice(0, 6)}...${player?.slice(-4)} hits ${streakLength}-STREAK! Bonus: ${formatEther(bonusAmount)} ETH`;

                    events.push({
                        player,
                        description,
                        blockNumber: Number(log.blockNumber),
                        eventType: 'streak',
                        transactionHash: log.transactionHash,
                        logIndex: log.logIndex
                    });
                }
            });

            return events;
        }
    },
    {
        eventName: 'BankDeposit',
        invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
            const queries: string[][] = [
                ['bankBalance'],
                ['streakBonus3'],
                ['streakBonus4'],
                ['streakBonus5'],
                ['streakBonus6']
            ];

            if (logs.some((log: any) => log.args.player === activeAccount)) {
                queries.push(
                    ['playerBalance'],
                    ['playerShare'],
                    ['playerShareValue'],
                    ['playerTotalEarnings']
                );
            }

            return queries;
        },
        processLogs: (logs: any[]) => {
            const events: StreamEvent[] = [];

            logs.forEach((log: any) => {
                if (log.args.player) {
                    const { player, amount, newSharePercent } = log.args;
                    const description = `${player.slice(0, 6)}...${player?.slice(-4)} deposits ${formatEther(amount)} ETH (${newSharePercent}% share)`;

                    events.push({
                        player,
                        description,
                        blockNumber: Number(log.blockNumber),
                        eventType: 'deposit',
                        transactionHash: log.transactionHash,
                        logIndex: log.logIndex
                    });
                }
            });

            return events;
        }
    },
    {
        eventName: 'BankWithdrawal',
        invalidateQueries: (logs: any[], activeAccount: string | undefined) => {
            const queries: string[][] = [
                ['bankBalance'],
                ['streakBonus3'],
                ['streakBonus4'],
                ['streakBonus5'],
                ['streakBonus6']
            ];

            if (logs.some((log: any) => log.args.player === activeAccount)) {
                queries.push(
                    ['playerBalance'],
                    ['playerShare'],
                    ['playerShareValue'],
                    ['playerTotalEarnings']
                );
            }

            return queries;
        },
        processLogs: (logs: any[]) => {
            const events: StreamEvent[] = [];

            logs.forEach((log: any) => {
                if (log.args.player) {
                    const { player, amount } = log.args;
                    const description = `${player.slice(0, 6)}...${player?.slice(-4)} withdraws ${formatEther(amount)} ETH`;

                    events.push({
                        player,
                        description,
                        blockNumber: Number(log.blockNumber),
                        eventType: 'withdrawal',
                        transactionHash: log.transactionHash,
                        logIndex: log.logIndex
                    });
                }
            });

            return events;
        }
    }
];

