// External library imports
import { Account } from "thirdweb/wallets";
import { ThirdwebClient, waitForReceipt } from "thirdweb";
import { createWalletClient, Hash, http, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getTransactionReceipt } from "viem/actions";

// Local imports
import { contractAddress, privateKey, wagmiConfig, viemG7Testnet } from '../../config';
import { 
    Move, 
    GameState,
    createGame,
    joinGame,
    player1MakeMove,
    player2MakeMove,
    revealMove,
    claimTimeoutWin,
    getGame,
    getContractConstants,
    generateCommit,
    generateSalt,
    determineWinner,
    withdrawAfterTimeout,
    getActiveGame
} from "../../utils/rpsGame";
import { CommandDefinition, CommandPattern } from '../types';

export interface RockPaperScissorsCommandParams {
    setCurrentGameId: (gameId: number | null) => void;
    setPlayerRole: (role: 'player1' | 'player2' | null) => void;
    setBetAmount: (amount: bigint | null) => void;
    setPlayer1Move: (move: Move) => void;
    setPlayer2Move: (move: Move) => void;
    setGameState: (state: 'waiting' | 'committed' | 'revealed' | 'finished' | 'cancelled' | 'timeout') => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setOutcome: (outcome: 'player1' | 'player2' | 'draw' | null) => void;
    currentGameId: number | null;
    playerRole: 'player1' | 'player2' | null;
    betAmount: bigint | null;
    player1Move: Move;
    player2Move: Move;
    gameState: 'waiting' | 'committed' | 'revealed' | 'finished' | 'cancelled' | 'timeout';
    isProcessing: boolean;
    outcome: 'player1' | 'player2' | 'draw' | null;
}

export type RPSGameCommandParams = {
    onGameUpdate?: (gameInfo: any) => void;
    getCurrentGameId: () => number | null;
    setCurrentGameId: (gameId: number | null) => void;
};

export type TerminalCommandParams = {
    activeAccount: Account | undefined;
    client: ThirdwebClient;
    gameParams: RPSGameCommandParams;
};

declare global {
    interface Window {
        ethereum?: any;
    }
}

export const rpsGameCommands: CommandDefinition<TerminalCommandParams>[] = [
    {
        pattern: {
            pattern: /^create( \d+)?$/,
            name: 'create',
            description: 'Create a new RPS game (optionally with custom timeout in minutes)',
            usage: 'create [timeout]'
        },
        handler: async ({ input, params }) => {
            const { activeAccount, client, gameParams } = params;
            console.log('gameParams', gameParams);
            const { setCurrentGameId } = gameParams;
            
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

            // Get contract constants
            const constants = await getContractConstants(contractAddress);

            if (!constants) {
                return { output: ["Failed to get contract constants"] };
            }

            // Parse timeout if provided, otherwise use default
            const timeoutMatch = input.match(/^create (\d+)$/);
            const timeoutMinutes = timeoutMatch ? parseInt(timeoutMatch[1]) : Number(constants.defaultTimeout) / 60;
            const timeoutSeconds = timeoutMinutes * 60;

            const result = await createGame(
                contractAddress,
                timeoutSeconds,
                constants.minimumBet,
                _client,
                account
            );

            if (result.success && result.transactionHash) {
                // Wait for transaction to be mined and get game ID
                // Note: In a real implementation, you'd want to parse the transaction receipt
                // to get the actual game ID. For now, we'll just acknowledge the creation.
                const receipt = result.receipt;
                // const receipt = await getTransactionReceipt(
                //     _client as any, // TODO: Fix type compatibility between ThirdwebClient and viem Client
                //     { hash: result.transactionHash as Hash }
                // );
                console.log('receipt', receipt);
                const gameId = receipt.logs[0].topics[1];
                console.log('gameId', Number(gameId));
                setCurrentGameId(Number(gameId));
                // setCurrentGameId(null); // Reset current game
                return { 
                    output: [
                        "Game creation transaction sent!",
                        `Transaction hash: ${result.transactionHash}`,
                        "Please check the transaction receipt to get your game ID."
                    ]
                };
            }

            return { output: [result.description] };
        }
    },
    {
        pattern: {
            pattern: /^join \d+$/,
            name: 'join',
            description: 'Join an existing RPS game',
            usage: 'join <gameId>'
        },
        handler: async ({ input, params }) => {
            const { activeAccount, client, gameParams } = params;
            const { setCurrentGameId } = gameParams;
            
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

            const gameId = parseInt(input.split(' ')[1]);
            const result = await joinGame(contractAddress, gameId, _client, account);

            if (result.success && result.transactionHash) {
                setCurrentGameId(gameId);
                return { 
                    output: [
                        "Successfully joined the game!",
                        `Transaction hash: ${result.transactionHash}`,
                        "Use 'move2 <move>' to make your move (1=Rock, 2=Paper, 3=Scissors)"
                    ]
                };
            }

            return { output: [result.description] };
        }
    },
    {
        pattern: {
            pattern: /^move1 (1|2|3)$/,
            name: 'move1',
            description: 'Make a move as player 1 (1=Rock, 2=Paper, 3=Scissors)',
            usage: 'move1 <move>'
        },
        handler: async ({ input, params }) => {
            const { activeAccount, client, gameParams } = params;
            const { getCurrentGameId } = gameParams;
            
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

            const gameId = getCurrentGameId();
            if (gameId === null) {
                return { output: ["No active game. Create or join a game first."] };
            }

            const move = parseInt(input.split(' ')[1]) as Move;
            const salt = generateSalt();
            const commit = await generateCommit(move, salt);

            const result = await player1MakeMove(contractAddress, gameId, commit, _client, account);

            if (result.success && result.transactionHash) {
                // Store salt for later reveal
                localStorage.setItem(`rps_salt_${gameId}`, salt);
                return { 
                    output: [
                        "Move committed successfully!",
                        `Transaction hash: ${result.transactionHash}`,
                        "Use 'reveal' to reveal your move after player 2 makes their move."
                    ]
                };
            }

            return { output: [result.description] };
        }
    },
    {
        pattern: {
            pattern: /^move2 (1|2|3)$/,
            name: 'move2',
            description: 'Make a move as player 2 (1=Rock, 2=Paper, 3=Scissors)',
            usage: 'move2 <move>'
        },
        handler: async ({ input, params }) => {
            const { activeAccount, client, gameParams } = params;
            const { getCurrentGameId } = gameParams;
            
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

            const gameId = getCurrentGameId();
            if (gameId === null) {
                return { output: ["No active game. Create or join a game first."] };
            }

            const move = parseInt(input.split(' ')[1]) as Move;
            const result = await player2MakeMove(contractAddress, gameId, move, _client, account);

            if (result.success && result.transactionHash) {
                return { 
                    output: [
                        "Move made successfully!",
                        `Transaction hash: ${result.transactionHash}`,
                        "Waiting for player 1 to reveal their move..."
                    ]
                };
            }

            return { output: [result.description] };
        }
    },
    {
        pattern: {
            pattern: /^reveal (0|1|2|3)$/,
            name: 'reveal',
            description: 'Reveal player 1\'s move',
            usage: 'reveal'
        },
        handler: async ({ input, params }) => {
            const { activeAccount, client, gameParams } = params;
            const { getCurrentGameId } = gameParams;
            
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

            const gameId = getCurrentGameId();
            if (gameId === null) {
                return { output: ["No active game. Create or join a game first."] };
            }

            // Get game info to check state and get player 1's move
            const gameInfo = await getGame(contractAddress, gameId);
            if (!gameInfo) {
                return { output: ["Failed to get game info"] };
            }

            if (gameInfo.state !== GameState.Committed) {
                return { output: ["Game is not in committed state. Player 2 must make their move first."] };
            }

            // Get stored salt
            const salt = localStorage.getItem(`rps_salt_${gameId}`);
            if (!salt) {
                return { output: ["No stored salt found for this game. Did you make the initial move?"] };
            }

            const move = parseInt(input.split(' ')[1]) as Move;


            const result = await revealMove(
                contractAddress,
                gameId,
                move,
                salt,
                _client,
                account
            );

            if (result.success && result.transactionHash) {
                // Clean up stored salt
                localStorage.removeItem(`rps_salt_${gameId}`);
                return { 
                    output: [
                        "Move revealed successfully!",
                        `Transaction hash: ${result.transactionHash}`,
                        "Use 'info' to check the game result."
                    ]
                };
            }

            return { output: [result.description] };
        }
    },
    {
        pattern: {
            pattern: /^claim$/,
            name: 'claim',
            description: 'Claim timeout win',
            usage: 'claim'
        },
        handler: async ({ input, params }) => {
            const { activeAccount, client, gameParams } = params;
            const { getCurrentGameId } = gameParams;
            
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

            const gameId = getCurrentGameId();
            if (gameId === null) {
                return { output: ["No active game. Create or join a game first."] };
            }

            const result = await claimTimeoutWin(contractAddress, gameId, _client, account);

            if (result.success && result.transactionHash) {
                return { 
                    output: [
                        "Timeout win claimed successfully!",
                        `Transaction hash: ${result.transactionHash}`
                    ]
                };
            }

            return { output: [result.description] };
        }
    },
    {
        pattern: {
            pattern: /^info( \d+)?$/,
            name: 'info',
            description: 'Get game information (for current or specified game)',
            usage: 'info [gameId]'
        },
        handler: async ({ input, params }) => {
            const { gameParams } = params;
            const { getCurrentGameId } = gameParams;

            let gameId: number;
            const gameIdMatch = input.match(/^info (\d+)$/);
            
            if (gameIdMatch) {
                gameId = parseInt(gameIdMatch[1]);
            } else {
                gameId = getCurrentGameId() ?? -1;
                if (gameId === -1) {
                    return { output: ["No active game. Specify a game ID or create/join a game first."] };
                }
            }

            const gameInfo = await getGame(contractAddress, gameId);
            if (!gameInfo) {
                return { output: ["Game not found"] };
            }

            const moveNames = ['None', 'Rock', 'Paper', 'Scissors'];
            const stateNames = [
                'Waiting for Player 2',
                'Waiting for Player 1 Move',
                'Waiting for Player 2 Move',
                'Committed',
                'Revealed',
                'Finished',
                'Cancelled',
                'Player 1 Timeout'
            ];

            const output = [
                `Game #${gameId} Information:`,
                `State: ${stateNames[gameInfo.state]}`,
                `Player 1: ${gameInfo.player1}`,
                `Player 2: ${gameInfo.player2}`,
                `Bet Amount: ${gameInfo.betAmount.toString()} wei`,
                `Timeout: ${Number(gameInfo.timeout) / 60} minutes`,
                `Created At: ${new Date(Number(gameInfo.createdAt) * 1000).toLocaleString()}`,
                '',
                'Moves:',
                `Player 1: ${moveNames[gameInfo.player1Move]} ${gameInfo.player1Revealed ? '(Revealed)' : '(Committed)'}`,
                `Player 2: ${moveNames[gameInfo.player2Move]}`,
                '',
                'Game Progress:',
                `Player 1 Made Move: ${gameInfo.player1MadeMove}`,
                `Player 2 Made Move: ${gameInfo.player2MadeMove}`,
                `Player 1 Revealed: ${gameInfo.player1Revealed}`
            ];

            // If game is finished, show the winner
            if (gameInfo.state === GameState.Finished) {
                const winner = determineWinner(gameInfo.player1Move, gameInfo.player2Move);
                if (winner === 'draw') {
                    output.push('\nResult: Draw!');
                } else {
                    output.push(`\nResult: ${winner === 'player1' ? 'Player 1' : 'Player 2'} wins!`);
                }
            }

            return { output };
        }
    },
    {
        pattern: {
            pattern: /^constants$/,
            name: 'constants',
            description: 'Get contract constants',
            usage: 'constants'
        },
        handler: async () => {
            const constants = await getContractConstants(contractAddress);
            if (!constants) {
                return { output: ["Failed to get contract constants"] };
            }

            return {
                output: [
                    "Contract Constants:",
                    `Minimum Bet: ${constants.minimumBet.toString()} wei`,
                    `Default Timeout: ${Number(constants.defaultTimeout) / 60} minutes`
                ]
            };
        }
    },
    {
        pattern: {
            pattern: /^withdraw$/,
            name: 'withdraw',
            description: 'Withdraw bet if player 2 hasn\'t joined within timeout',
            usage: 'withdraw'
        },
        handler: async ({ input, params }) => {
            const { activeAccount, client, gameParams } = params;
            const { getCurrentGameId } = gameParams;
            
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

            const gameId = getCurrentGameId();
            if (gameId === null) {
                return { output: ["No active game. Create or join a game first."] };
            }

            // Get game info to check state
            const gameInfo = await getGame(contractAddress, gameId);
            if (!gameInfo) {
                return { output: ["Failed to get game info"] };
            }

            if (gameInfo.state !== GameState.WaitingForPlayer2) {
                return { output: ["Game is not in waiting state. Can only withdraw if player 2 hasn't joined."] };
            }

            const result = await withdrawAfterTimeout(contractAddress, gameId, _client, account);

            if (result.success && result.transactionHash) {
                return { 
                    output: [
                        "Withdrawal successful!",
                        `Transaction hash: ${result.transactionHash}`,
                        "Your bet has been returned."
                    ]
                };
            }

            return { output: [result.description] };
        }
    },
    {
        pattern: {
            pattern: /^active$/,
            name: 'active',
            description: 'Get your active game ID',
            usage: 'active'
        },
        handler: async ({ input, params }) => {
            const { activeAccount } = params;
            
            if (!activeAccount?.address) {
                return { output: ["No account selected"] };
            }

            const result = await getActiveGame(contractAddress, activeAccount.address);

            if (result.success) {
                if (result.gameId === 0) {
                    return { output: ["You have no active games."] };
                }
                return { 
                    output: [
                        `Your active game ID: ${result.gameId}`,
                        "Use 'info' to get more details about this game."
                    ]
                };
            }

            return { output: [result.description] };
        }
    },
    {
        isDefault: true,
        handler: async ({ input }) => {
            console.log('input to default handler', input);
            const helpText = [
                `Command not found: "${input}"`,
                '',
                'Available commandsssss:',
                ...rpsGameCommands
                    .filter((cmd): cmd is CommandDefinition<TerminalCommandParams> & { pattern: CommandPattern } => 
                        cmd.pattern !== undefined)
                    .map(cmd => `• ${cmd.pattern.name}: ${cmd.pattern.description}`),
                '',
                'Usage examples:',
                ...rpsGameCommands
                    .filter((cmd): cmd is CommandDefinition<TerminalCommandParams> & { pattern: CommandPattern } => 
                        cmd.pattern !== undefined)
                    .map(cmd => `  ${cmd.pattern.usage}`)
            ];

            return { output: helpText };
        }
    }
]; 