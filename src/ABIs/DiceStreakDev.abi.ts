// DiceStreakDev ABI - extends DiceStreak with dev functions
export const diceStreakDevABI = [
  // All DiceStreak functions
  {
    "inputs": [],
    "name": "getBetAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPayoutMultiplier",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBankBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBestCombo",
    "outputs": [
      {"internalType": "uint8[]", "name": "streakFaces", "type": "uint8[]"},
      {"internalType": "address", "name": "player", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getPlayerStreak",
    "outputs": [{"internalType": "uint8[]", "name": "", "type": "uint8[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getPlayerTotalWinnings",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getGameStatus",
    "outputs": [{"internalType": "enum DiceStreak.GameStatus", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getLastBetResult",
    "outputs": [{"internalType": "enum DiceStreak.BetResult", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint8", "name": "number", "type": "uint8"}],
    "name": "getStatistics",
    "outputs": [
      {"internalType": "uint256", "name": "occurrences", "type": "uint256"},
      {"internalType": "uint256", "name": "bets", "type": "uint256"},
      {"internalType": "uint256", "name": "wins", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "hasCommit",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint8", "name": "guess", "type": "uint8"}],
    "name": "play",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "accept",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "inspectOutcome",
    "outputs": [
      {"internalType": "uint8", "name": "diceResult", "type": "uint8"},
      {"internalType": "uint256", "name": "prizeValue", "type": "uint256"},
      {"internalType": "string", "name": "description", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Dev-specific functions
  {
    "inputs": [{"internalType": "uint8", "name": "result", "type": "uint8"}],
    "name": "setPredeterminedResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
    "name": "getPredeterminedResult",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"}
    ],
    "name": "Spin",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint8", "name": "guess", "type": "uint8"},
      {"indexed": false, "internalType": "uint8", "name": "result", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256"}
    ],
    "name": "PlayerWin",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "player", "type": "address"},
      {"indexed": false, "internalType": "uint8", "name": "guess", "type": "uint8"},
      {"indexed": false, "internalType": "uint8", "name": "result", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "basePayout", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "bonusPayout", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "comboType", "type": "string"}
    ],
    "name": "PlayerWinWithCombo",
    "type": "event"
  }
] as const;
