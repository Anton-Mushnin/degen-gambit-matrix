// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

    /// @notice Arbitrum system interface for L2-specific block functions
    interface ArbSys {
        function arbBlockNumber() external view returns (uint256);
        function arbBlockHash(uint256 number) external view returns (bytes32);
    }

/// @title CommitRevealRandomness
/// @notice Provides secure random numbers using commit/reveal pattern
/// @dev Players commit to data, then reveal to get random numbers
/// @dev Uses keccak256 hash of committed data for randomness
contract CommitRevealRandomness {
    

    
    /// @notice Contract version - accessible by frontend
    string public constant COMMIT_REVEAL_RANDOMNESS_VERSION = "1.0.0";
    
    /// @notice Player's committed data and state
    struct CommitData {
        bytes32 committedHash;    // Hash of (data + player)
        uint256 commitBlock;      // Block when commit was made
        uint256 revealWindow;     // Number of blocks after commitBlock for reveal
    }
    
    /// @notice Mapping from player address to their commit data
    mapping(address => CommitData) public playerCommits;
    
    /// @notice Emitted when a player commits data
    event DataCommitted(
        address indexed player,
        bytes32 committedHash,
        uint256 commitBlock,
        uint256 revealWindow
    );
    
    /// @notice Emitted when data is revealed and random number generated
    event DataRevealed(
        address indexed player,
        uint256 randomNumber,
        bytes revealedData
    );
    
    /// @notice Error when player already has committed data
    error AlreadyCommitted();
    
    /// @notice Error when trying to reveal without commit
    error NoCommitToReveal();
    
    /// @notice Error when data has already been revealed
    error AlreadyRevealed();
    
    /// @notice Error when revealed data doesn't match commit hash
    error InvalidReveal();
    
    /// @notice Get current Arbitrum block number
    function _blockNumber() internal view returns (uint256) {
        return ArbSys(address(100)).arbBlockNumber();
    }
    
    /// @notice Get Arbitrum block hash
    function _blockhash(uint256 number) internal view returns (bytes32) {
        return ArbSys(address(100)).arbBlockHash(number);
    }
    
    /// @notice Clear expired commit for the caller
    function clearExpiredCommit() internal {
        CommitData storage commit = playerCommits[msg.sender];
        
        // Check if commit exists and is expired
        if (commit.commitBlock != 0 && _blockNumber() > commit.commitBlock + commit.revealWindow) {
            commit.committedHash = bytes32(0);
            commit.commitBlock = 0;
            commit.revealWindow = 0;
        }
    }
    
    /// @notice Commit data for later reveal
    /// @param dataHash The hash of data to commit (produced on frontend), optional
    /// @param revealWindow Number of blocks after commitBlock for reveal
    function move(bytes32 dataHash, uint256 revealWindow) external {
        uint256 currentBlock = _blockNumber();
        CommitData storage commit = playerCommits[msg.sender];
        
        // Clear expired commit if it exists
        clearExpiredCommit();
        
        // Check if player already has committed data
        if (commit.commitBlock != 0) {
            revert AlreadyCommitted();
        }
        
        // Store the provided hash directly (or empty if not provided)
        commit.committedHash = dataHash;
        commit.commitBlock = currentBlock;
        commit.revealWindow = revealWindow;
        
        emit DataCommitted(msg.sender, dataHash, currentBlock, revealWindow);
    }
    
    /// @notice Reveal committed data and generate random number
    /// @param data The original data that was committed, optional
    /// @return randomNumber The generated random number
    function reveal(bytes calldata data) external returns (uint256 randomNumber) {
        uint256 currentBlock = _blockNumber();
        CommitData storage commit = playerCommits[msg.sender];
        
        // Check if player has committed data
        if (commit.commitBlock == 0) {
            revert NoCommitToReveal();
        }
        
        // Check if reveal block has been mined
        if (currentBlock <= commit.commitBlock) {
            revert("Reveal block not yet mined");
        }
        
        // Check if reveal is within the allowed window
        if (currentBlock > commit.commitBlock + commit.revealWindow) {
            // Clear expired commit
            clearExpiredCommit();
            revert("Reveal window expired");
        }
        
        // If a hash was committed, data must be provided and must match
        if (commit.committedHash != bytes32(0)) {
            if (data.length == 0) {
                revert InvalidReveal();
            }
            bytes32 expectedHash = keccak256(abi.encodePacked(data, msg.sender));
            if (expectedHash != commit.committedHash) {
                revert InvalidReveal();
            }
        }
        
        // Generate random number using entropy
        randomNumber = _entropy(msg.sender, commit.commitBlock);
        
        // Clear commit data after successful reveal
        clearExpiredCommit();
        
        emit DataRevealed(msg.sender, randomNumber, data);
    }
    
    /// @notice Generate entropy for random number generation
    /// @param player The player's address
    /// @param commitBlock The block number to use for entropy
    /// @return Entropy value
    function _entropy(
        address player,
        uint256 commitBlock
    ) internal view virtual returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encode(
                        _blockhash(commitBlock),
                        player
                    )
                )
            );
    }
    
    /// @notice Get bounded random number in range [1, max]
    /// @param max Maximum value (inclusive)
    /// @return Random number between 1 and max
    function revealInRange(bytes calldata data, uint256 max) external returns (uint256) {
        require(max > 0, "Max must be positive");
        uint256 randomNumber = this.reveal(data);
        return (randomNumber % max) + 1;
    }
    
    /// @notice Get random boolean (true/false)
    /// @return Random boolean
    function revealBool(bytes calldata data) external returns (bool) {
        uint256 randomNumber = this.reveal(data);
        return (randomNumber % 2) == 1;
    }
    
    /// @notice Check if player has committed data
    /// @param player Player address to check
    /// @return hasCommitted Whether player has committed data
    function hasCommit(address player) external view returns (bool hasCommitted) {
        CommitData storage commit = playerCommits[player];
        hasCommitted = commit.commitBlock != 0;
    }
    
    /// @notice Get commit details for a player
    /// @param player Player address
    /// @return committedHash Hash of committed data
    /// @return commitBlock Block when commit was made
    function getCommitDetails(address player) external view returns (
        bytes32 committedHash,
        uint256 commitBlock
    ) {
        CommitData storage commit = playerCommits[player];
        return (commit.committedHash, commit.commitBlock);
    }
} 