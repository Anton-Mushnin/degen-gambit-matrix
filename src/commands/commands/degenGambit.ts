// External library imports
import { Account } from "thirdweb/wallets";
import { ThirdwebClient } from "thirdweb";
import { createWalletClient, http, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Local imports
import { contractAddress, privateKey, wagmiConfig } from '../../config';
import { _accept, _acceptThirdWebClient, spin } from "../../utils/degenGambit";
import { CommandDefinition, CommandPattern } from '../types';

export type SpinResult = {
    description: string;
    outcome?: readonly bigint[];
    prize?: string;
    prizeType?: number;
    receipt?: string | null;
};

export type DegenGambitCommandParams = {
    activeAccount: Account | undefined;
    client: ThirdwebClient;
    onSetNumbers?: (numbers: number[]) => void;
    getCurrentNumbers: () => Promise<number[]>;
    onAutoSpinToggle: () => void;
    setIsWin: (isWin: boolean) => void;
};

export const degenGambitCommands: CommandDefinition<DegenGambitCommandParams>[] = [
    {
        pattern: {
            pattern: /^getsome$/,
            name: 'getsome',
            description: 'Visit getsome.game7.io to get some tokens',
            usage: 'getsome'
        },
        handler: async ({ params }) => {
            window.open(
                `https://getsome.game7.io?network=testnet&address=${params.activeAccount?.address}`,
                "_blank"
            );
            return { output: [] };
        }
    },
    {
        pattern: {
            pattern: /^spin( boost)?$/,
            name: 'spin',
            description: 'Spin the wheel (optionally with boost)',
            usage: 'spin [boost]'
        },
        handler: async ({ input, params }) => {
            const { activeAccount, client, setIsWin } = params;
            
            let _client: WalletClient | ThirdwebClient | undefined;
            let account: Account | undefined;
            
            if (privateKey) {
                _client = createWalletClient({
                    account: privateKeyToAccount(privateKey),
                    chain: wagmiConfig.chains[0],
                    transport: http()
                });
            } else {
                if (window.ethereum && activeAccount?.address) {
                    _client = client;
                }
                account = activeAccount;
            }

            if (!_client) {
                return { output: ["No account selected"] };
            }

            const isBoost = input === "spin boost";
            const spinResult = await spin(contractAddress, isBoost, account, _client);

            // Handle win state and auto-accept
            if (spinResult.prize && Number(spinResult.prize) > 0) {
                // Set win state after 8 seconds
                setTimeout(() => setIsWin(true), 8000);
                
                // Auto-accept after 20 seconds
                setTimeout(async () => {
                    setIsWin(false);
                    
                    // Auto-accept logic
                    if (privateKey) {
                        const acceptClient = createWalletClient({
                            account: privateKeyToAccount(privateKey),
                            chain: wagmiConfig.chains[0],
                            transport: http()
                        });
                        await _accept(contractAddress, acceptClient);
                    } else if (activeAccount) {
                        await _acceptThirdWebClient(contractAddress, activeAccount, client);
                    }
                }, 20000);
            }

            return {
                output: [spinResult.description],
                outcome: spinResult.outcome ? [...spinResult.outcome.slice(0, 3)] : undefined,
                isPrize: spinResult.prize ? Number(spinResult.prize) > 0 : undefined
            };
        }
    },
    {
        pattern: {
            pattern: /^auto$/,
            name: 'auto',
            description: 'Toggle auto spin',
            usage: 'auto'
        },
        handler: async ({ params }) => {
            const { onAutoSpinToggle } = params;
            onAutoSpinToggle?.();
            return { output: [] };
        }
    },
    {
        pattern: {
            pattern: /^set \d+ \d+$/,
            name: 'set',
            description: 'Set a number at a specific index',
            usage: 'set <index> <number>'
        },
        handler: async ({ input, params }) => {
            const { onSetNumbers, getCurrentNumbers } = params;
            const [, indexStr, numberStr] = input.split(' ');
            const index = parseInt(indexStr);
            const number = parseInt(numberStr);

            const currentNumbers = await getCurrentNumbers();

            if (index < 0 || index >= currentNumbers.length) {
                return { 
                    output: [`Invalid index. Must be between 0 and ${currentNumbers.length - 1}`] 
                };
            }

            const newNumbers = [...currentNumbers];
            newNumbers[index] = number;
            
            // Notify component of new numbers
            onSetNumbers?.(newNumbers);
            
            return {
                output: [
                    "Minor symbols:", 
                    newNumbers.slice(1, 16).join(', '), 
                    "Major symbols:", 
                    newNumbers.slice(-3).join(', ')
                ]
            };
        }
    },
    {
        pattern: {
            pattern: /^accept$/,
            name: 'accept',
            description: 'Accept a pending prize',
            usage: 'accept'
        },
        handler: async ({ params }) => {
            const { activeAccount, client } = params;
            
            let _client: WalletClient | ThirdwebClient | undefined;
            
            if (privateKey) {
                _client = createWalletClient({
                    account: privateKeyToAccount(privateKey),
                    chain: wagmiConfig.chains[0],
                    transport: http()
                });
            } else {
                if (window.ethereum && activeAccount?.address) {
                    _client = client;
                }
            }

            if (!_client) {
                return { output: ["No account selected"] };
            }

            try {
                if (privateKey) {
                    await _accept(contractAddress, _client as WalletClient);
                } else {
                    await _acceptThirdWebClient(contractAddress, activeAccount, _client as ThirdwebClient);
                }
                return { output: ["Prize accepted successfully"] };
            } catch (error: any) {
                return { output: [`Failed to accept prize: ${error.message}`] };
            }
        }
    },
    {
        isDefault: true,
        handler: async ({ input }) => {
            const helpText = [
                `Command not found: "${input}"`,
                '',
                'Available commands:',
                ...degenGambitCommands
                    .filter((cmd): cmd is CommandDefinition<DegenGambitCommandParams> & { pattern: CommandPattern } => 
                        cmd.pattern !== undefined)
                    .map(cmd => `• ${cmd.pattern.name}: ${cmd.pattern.description}`),
                '',
                'Usage examples:',
                ...degenGambitCommands
                    .filter((cmd): cmd is CommandDefinition<DegenGambitCommandParams> & { pattern: CommandPattern } => 
                        cmd.pattern !== undefined)
                    .map(cmd => `  ${cmd.pattern.usage}`)
            ];

            return { output: helpText };
        }
    }
];
