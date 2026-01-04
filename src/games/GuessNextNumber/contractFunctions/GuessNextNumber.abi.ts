export const guessNextNumberABI = [
    // Write functions
    {
        inputs: [{ type: 'uint8', name: 'guessedNumber' }],
        name: 'guess',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'accept',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'deposit',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [{ type: 'uint256', name: 'amount' }],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'player' }],
        name: 'inspectOutcome',
        outputs: [
            { type: 'uint256', name: 'payout' },
            { type: 'bytes32', name: 'resultData' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // Constants
    {
        inputs: [],
        name: 'costOfPlay',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'payoutMultiplier',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'depositFeePercent',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    // Bank
    {
        inputs: [],
        name: 'getBankBalance',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'getStreakBonuses',
        outputs: [
            { type: 'uint256', name: 'bonus3' },
            { type: 'uint256', name: 'bonus4' },
            { type: 'uint256', name: 'bonus5' },
            { type: 'uint256', name: 'bonus6' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // Statistics
    {
        inputs: [],
        name: 'getStatistics',
        outputs: [
            {
                type: 'tuple[6]',
                name: '',
                components: [
                    { type: 'uint256', name: 'occurrences' }
                ]
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'getBestStreak',
        outputs: [
            { type: 'uint8', name: 'streakLength' },
            { type: 'address', name: 'player' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // Player (game)
    {
        inputs: [{ type: 'address', name: 'player' }],
        name: 'getPlayerStatus',
        outputs: [{ type: 'uint8', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'player' }],
        name: 'getPlayerStreak',
        outputs: [{ type: 'uint8', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'player' }],
        name: 'getPlayerTotalWinnings',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    // Player (bank)
    {
        inputs: [{ type: 'address', name: 'player' }],
        name: 'getPlayerShare',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'player' }],
        name: 'getPlayerShareValue',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'player' }],
        name: 'getPlayerTotalEarnings',
        outputs: [{ type: 'int256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    // Events
    {
        anonymous: false,
        inputs: [
            { indexed: true, type: 'address', name: 'player' },
            { indexed: false, type: 'uint8', name: 'guess' }
        ],
        name: 'GuessCommitted',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, type: 'address', name: 'player' },
            { indexed: false, type: 'uint8', name: 'guess' },
            { indexed: false, type: 'uint8', name: 'result' },
            { indexed: false, type: 'uint256', name: 'payout' }
        ],
        name: 'PlayerWin',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, type: 'address', name: 'player' },
            { indexed: false, type: 'uint8', name: 'streakLength' },
            { indexed: false, type: 'uint256', name: 'bonusAmount' }
        ],
        name: 'StreakBonus',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, type: 'address', name: 'player' },
            { indexed: false, type: 'uint256', name: 'amount' },
            { indexed: false, type: 'uint256', name: 'newSharePercent' }
        ],
        name: 'BankDeposit',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, type: 'address', name: 'player' },
            { indexed: false, type: 'uint256', name: 'amount' }
        ],
        name: 'BankWithdrawal',
        type: 'event'
    }
] as const;

