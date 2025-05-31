// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RockPaperScissors
 * @dev Implementation of Rock Paper Scissors game with commit-reveal scheme
 */
contract RockPaperScissors is ReentrancyGuard, Ownable {
    // Constants
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 5; // 5%
    uint256 public constant MINIMUM_BET = 0.001 ether;
    uint256 public constant DEFAULT_TIMEOUT = 24 hours;

    // Enums
    enum Move { None, Rock, Paper, Scissors }
    enum GameState { 
        WaitingForPlayer2, 
        WaitingForPlayer1Move,
        WaitingForPlayer2Move,
        Committed, 
        Revealed, 
        Finished, 
        Cancelled, 
        Player1Timeout 
    }

    // Structs
    struct Game {
        address player1;
        address player2;
        bytes32 player1Commit;
        Move player1Move;
        Move player2Move;
        uint256 betAmount;
        uint256 timeout;
        uint256 createdAt;
        GameState state;
        bool player1Revealed;
        bool player1MadeMove;
        bool player2MadeMove;
    }

    // State variables
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public activeGames; // player address => gameId
    uint256 public gameCounter;
    address public feeCollector;

    // Events
    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 betAmount, uint256 timeout);
    event Player2Joined(uint256 indexed gameId, address indexed player2, Move move);
    event MoveRevealed(uint256 indexed gameId, Move move);
    event GameFinished(uint256 indexed gameId, address winner, uint256 amount);
    event GameCancelled(uint256 indexed gameId, address indexed player);
    event GameTimeout(uint256 indexed gameId, address indexed player);
    event FundsWithdrawn(uint256 indexed gameId, address indexed player, uint256 amount);
    event Error(string message);

    // Modifiers
    modifier gameExists(uint256 gameId) {
        require(gameId < gameCounter, "Game does not exist");
        _;
    }

    modifier validMove(Move move) {
        require(move >= Move.Rock && move <= Move.Scissors, "Invalid move");
        _;
    }

    modifier onlyGamePlayer(uint256 gameId) {
        Game storage game = games[gameId];
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a game player");
        _;
    }

    modifier onlyPlayer1(uint256 gameId) {
        require(msg.sender == games[gameId].player1, "Not player 1");
        _;
    }

    modifier onlyPlayer2(uint256 gameId) {
        require(msg.sender == games[gameId].player2, "Not player 2");
        _;
    }

    // Constructor
    constructor(address _feeCollector) Ownable() {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }

    /**
     * @dev Creates a new game
     * @param timeout Custom timeout period (optional)
     */
    function createGame(uint256 timeout) external payable nonReentrant {
        require(msg.value >= MINIMUM_BET, "Bet too small");
        require(activeGames[msg.sender] == 0, "Player has active game");
        
        uint256 gameTimeout = timeout == 0 ? DEFAULT_TIMEOUT : timeout;
        uint256 gameId = gameCounter++;

        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            player1Commit: bytes32(0),
            player1Move: Move.None,
            player2Move: Move.None,
            betAmount: msg.value,
            timeout: gameTimeout,
            createdAt: block.timestamp,
            state: GameState.WaitingForPlayer2,
            player1Revealed: false,
            player1MadeMove: false,
            player2MadeMove: false
        });

        activeGames[msg.sender] = gameId;
        emit GameCreated(gameId, msg.sender, msg.value, gameTimeout);
    }

    /**
     * @dev Allows player 1 to make their move
     * @param gameId ID of the game
     * @param commit Hash of player's move and salt
     */
    function player1MakeMove(uint256 gameId, bytes32 commit) 
        external 
        nonReentrant 
        gameExists(gameId) 
        onlyPlayer1(gameId) 
    {
        Game storage game = games[gameId];
        require(game.state == GameState.WaitingForPlayer1Move, "Not player 1's turn");
        require(!game.player1MadeMove, "Move already made");
        require(block.timestamp <= game.createdAt + game.timeout, "Game timed out");

        game.player1Commit = commit;
        game.player1MadeMove = true;
        game.state = GameState.WaitingForPlayer2Move;

        emit MoveRevealed(gameId, Move.None); // Using existing event for now
    }

    /**
     * @dev Allows player 2 to join the game
     * @param gameId ID of the game to join
     */
    function joinGame(uint256 gameId) 
        external 
        payable 
        nonReentrant 
        gameExists(gameId) 
    {
        Game storage game = games[gameId];
        require(game.state == GameState.WaitingForPlayer2, "Game not available");
        require(block.timestamp <= game.createdAt + game.timeout, "Game timed out");
        require(msg.sender != game.player1, "Cannot join own game");
        require(msg.value == game.betAmount, "Incorrect bet amount");
        require(activeGames[msg.sender] == 0, "Player has active game");

        game.player2 = msg.sender;
        game.state = GameState.WaitingForPlayer1Move;
        activeGames[msg.sender] = gameId;

        emit Player2Joined(gameId, msg.sender, Move.None);
    }

    /**
     * @dev Allows player 2 to make their move
     * @param gameId ID of the game
     * @param move Player 2's move
     */
    function player2MakeMove(uint256 gameId, Move move) 
        external 
        nonReentrant 
        gameExists(gameId) 
        onlyPlayer2(gameId) 
        validMove(move) 
    {
        Game storage game = games[gameId];
        require(game.state == GameState.WaitingForPlayer2Move, "Not player 2's turn");
        require(!game.player2MadeMove, "Move already made");
        require(block.timestamp <= game.createdAt + game.timeout, "Game timed out");

        game.player2Move = move;
        game.player2MadeMove = true;
        game.state = GameState.Committed;

        emit MoveRevealed(gameId, move);
    }

    /**
     * @dev Allows player 1 to reveal their move
     * @param gameId ID of the game
     * @param move Player 1's move
     * @param salt Salt used for commitment
     */
    function revealMove(uint256 gameId, Move move, bytes32 salt) 
        external 
        nonReentrant 
        gameExists(gameId) 
        onlyPlayer1(gameId) 
        validMove(move) 
    {
        Game storage game = games[gameId];
        require(game.state == GameState.Committed, "Game not in committed state");
        require(block.timestamp <= game.createdAt + game.timeout, "Game timed out");
        require(!game.player1Revealed, "Move already revealed");
        require(game.player1MadeMove, "Player 1 hasn't made a move");
        
        bytes32 commit = keccak256(abi.encodePacked(move, salt));
        require(commit == game.player1Commit, "Invalid reveal");

        game.player1Move = move;
        game.player1Revealed = true;
        game.state = GameState.Revealed;

        emit MoveRevealed(gameId, move);
        
        _resolveGame(gameId);
    }

    /**
     * @dev Allows player 1 to withdraw if player 2 hasn't joined
     * @param gameId ID of the game
     */
    function withdrawAfterTimeout(uint256 gameId) 
        external 
        nonReentrant 
        gameExists(gameId) 
        onlyPlayer1(gameId) 
    {
        Game storage game = games[gameId];
        require(game.state == GameState.WaitingForPlayer2, "Game not in waiting state");
        require(block.timestamp > game.createdAt + game.timeout, "Timeout not reached");

        game.state = GameState.Cancelled;
        activeGames[game.player1] = 0;
        
        (bool success, ) = game.player1.call{value: game.betAmount}("");
        require(success, "Transfer failed");

        emit GameCancelled(gameId, game.player1);
    }

    /**
     * @dev Allows player 2 to claim win if player 1 hasn't revealed
     * @param gameId ID of the game
     */
    function claimTimeoutWin(uint256 gameId) 
        external 
        nonReentrant 
        gameExists(gameId) 
        onlyPlayer2(gameId) 
    {
        Game storage game = games[gameId];
        require(game.state == GameState.Committed, "Game not in committed state");
        require(block.timestamp > game.createdAt + game.timeout, "Timeout not reached");

        game.state = GameState.Player1Timeout;
        activeGames[game.player1] = 0;
        activeGames[game.player2] = 0;

        uint256 feeAmount = (game.betAmount * 2 * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 winAmount = (game.betAmount * 2) - feeAmount;

        (bool feeSuccess, ) = feeCollector.call{value: feeAmount}("");
        require(feeSuccess, "Fee transfer failed");

        (bool winSuccess, ) = game.player2.call{value: winAmount}("");
        require(winSuccess, "Win transfer failed");

        emit GameTimeout(gameId, game.player1);
        emit GameFinished(gameId, game.player2, winAmount);
    }

    /**
     * @dev Internal function to resolve the game after reveal
     * @param gameId ID of the game
     */
    function _resolveGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        require(game.state == GameState.Revealed, "Game not revealed");

        address winner;
        uint256 winAmount;
        uint256 feeAmount = (game.betAmount * 2 * PLATFORM_FEE_PERCENTAGE) / 100;

        if (game.player1Move == game.player2Move) {
            // Draw - split pot
            winAmount = (game.betAmount * 2 - feeAmount) / 2;
            (bool feeSuccess, ) = feeCollector.call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");

            (bool p1Success, ) = game.player1.call{value: winAmount}("");
            require(p1Success, "Player 1 transfer failed");

            (bool p2Success, ) = game.player2.call{value: winAmount}("");
            require(p2Success, "Player 2 transfer failed");

            emit GameFinished(gameId, address(0), winAmount * 2); // address(0) indicates draw
        } else {
            // Determine winner
            if (
                (game.player1Move == Move.Rock && game.player2Move == Move.Scissors) ||
                (game.player1Move == Move.Scissors && game.player2Move == Move.Paper) ||
                (game.player1Move == Move.Paper && game.player2Move == Move.Rock)
            ) {
                winner = game.player1;
            } else {
                winner = game.player2;
            }

            winAmount = (game.betAmount * 2) - feeAmount;

            (bool feeSuccess, ) = feeCollector.call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");

            (bool winSuccess, ) = winner.call{value: winAmount}("");
            require(winSuccess, "Win transfer failed");

            emit GameFinished(gameId, winner, winAmount);
        }

        game.state = GameState.Finished;
        activeGames[game.player1] = 0;
        activeGames[game.player2] = 0;
    }

    /**
     * @dev View function to get game details
     * @param gameId ID of the game
     */
    function getGame(uint256 gameId) 
        external 
        view 
        gameExists(gameId) 
        returns (
            address player1,
            address player2,
            Move player1Move,
            Move player2Move,
            uint256 betAmount,
            uint256 timeout,
            uint256 createdAt,
            GameState state,
            bool player1Revealed,
            bool player1MadeMove,
            bool player2MadeMove
        ) 
    {
        Game storage game = games[gameId];
        return (
            game.player1,
            game.player2,
            game.player1Move,
            game.player2Move,
            game.betAmount,
            game.timeout,
            game.createdAt,
            game.state,
            game.player1Revealed,
            game.player1MadeMove,
            game.player2MadeMove
        );
    }

    /**
     * @dev Allows owner to update fee collector address
     * @param newFeeCollector New fee collector address
     */
    function updateFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Invalid fee collector");
        feeCollector = newFeeCollector;
    }

    // Fallback and receive functions
    receive() external payable {
        revert("Direct deposits not allowed");
    }

    fallback() external payable {
        revert("Direct deposits not allowed");
    }
}
