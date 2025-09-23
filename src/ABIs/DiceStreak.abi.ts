export const diceStreakPlayABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_betAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_payoutMultiplier",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadyCommitted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyRevealed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidReveal",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoCommitToReveal",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "committedHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "commitBlock",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "revealWindow",
        "type": "uint256"
      }
    ],
    "name": "DataCommitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "randomNumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "revealedData",
        "type": "bytes"
      }
    ],
    "name": "DataRevealed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "guess",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "result",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "payout",
        "type": "uint256"
      }
    ],
    "name": "PlayerWin",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "guess",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "result",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "basePayout",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "bonusPayout",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "comboType",
        "type": "string"
      }
    ],
    "name": "PlayerWinWithCombo",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "COMMIT_REVEAL_RANDOMNESS_VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
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
    "inputs": [],
    "name": "bestCombo",
    "outputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "betAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBankBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBestCombo",
    "outputs": [
      {
        "internalType": "uint8[]",
        "name": "streakFaces",
        "type": "uint8[]"
      },
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBetAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getCommitDetails",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "committedHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "commitBlock",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getGameStatus",
    "outputs": [
      {
        "internalType": "enum DiceStreak.GameStatus",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getLastBetResult",
    "outputs": [
      {
        "internalType": "enum DiceStreak.BetResult",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPayoutMultiplier",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerStreak",
    "outputs": [
      {
        "internalType": "uint8[]",
        "name": "",
        "type": "uint8[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerTotalWinnings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "number",
        "type": "uint8"
      }
    ],
    "name": "getStatistics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "occurrences",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "bets",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "wins",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "hasCommit",
    "outputs": [
      {
        "internalType": "bool",
        "name": "hasCommitted",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "inspectOutcome",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "prizeValue",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "dataHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "revealWindow",
        "type": "uint256"
      }
    ],
    "name": "move",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "payoutMultiplier",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "guess",
        "type": "uint8"
      }
    ],
    "name": "play",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "playerCommits",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "committedHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "commitBlock",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "revealWindow",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "players",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalWinnings",
        "type": "uint256"
      },
      {
        "internalType": "enum DiceStreak.GameStatus",
        "name": "gameStatus",
        "type": "uint8"
      },
      {
        "internalType": "enum DiceStreak.BetResult",
        "name": "lastBetResult",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "pendingGuess",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "reveal",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "randomNumber",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "revealBool",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "max",
        "type": "uint256"
      }
    ],
    "name": "revealInRange",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "statistics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "occurrences",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "bets",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "wins",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
