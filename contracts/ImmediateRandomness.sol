// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Arbitrum system interface for L2-specific block functions
interface ArbSys {
    function arbBlockNumber() external view returns (uint256);
    function arbBlockHash(uint256 number) external view returns (bytes32);
}

/// @title ImmediateRandomness
/// @notice Provides immediate random numbers using blockhash + timestamp + address
/// @dev Uses previous block hash, current timestamp, and player address for entropy
/// @dev Immediate results, no waiting required
contract ImmediateRandomness {
    
    /// @notice Contract version - accessible by frontend
    string public constant IMMEDIATE_RANDOMNESS_VERSION = "1.0.0";
    
    /// @notice Emitted when random number is generated
    event RandomNumberGenerated(
        address indexed player,
        uint256 randomNumber,
        uint256 blockNumber,
        uint256 timestamp
    );
    
    /// @notice Error when max value is 0
    error MaxValueMustBePositive();
    
    /// @notice Get random number using blockhash + timestamp + address
    /// @return randomNumber The generated random number
    function getRandomNumberNotSecure() external returns (uint256 randomNumber) {
        uint256 currentBlock = ArbSys(address(100)).arbBlockNumber();
        uint256 currentTimestamp = block.timestamp;
        
        // Use previous block hash for better security
        bytes32 blockHash = ArbSys(address(100)).arbBlockHash(currentBlock - 1);
        
        // Combine entropy sources
        randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    blockHash,
                    currentTimestamp,
                    msg.sender
                )
            )
        );
        
        emit RandomNumberGenerated(
            msg.sender,
            randomNumber,
            currentBlock,
            currentTimestamp
        );
    }
    
    /// @notice Get random number in range [1, max]
    /// @param max Maximum value (inclusive)
    /// @return randomNumber Random number between 1 and max
    function getRandomInRangeNotSecure(uint256 max) external returns (uint256 randomNumber) {
        if (max == 0) {
            revert MaxValueMustBePositive();
        }
        
        uint256 rawRandom = this.getRandomNumberNotSecure();
        randomNumber = (rawRandom % max) + 1;
    }
    
    /// @notice Get random boolean (true/false)
    /// @return randomBool Random boolean value
    function getRandomBoolNotSecure() external returns (bool randomBool) {
        uint256 rawRandom = this.getRandomNumberNotSecure();
        randomBool = (rawRandom % 2) == 1;
    }
    
    /// @notice Get random number with custom seed
    /// @param seed Additional seed value to mix with entropy sources
    /// @return randomNumber The generated random number
    function getRandomNumberWithSeedNotSecure(uint256 seed) external returns (uint256 randomNumber) {
        uint256 currentBlock = ArbSys(address(100)).arbBlockNumber();
        uint256 currentTimestamp = block.timestamp;
        
        // Use previous block hash for better security
        bytes32 blockHash = ArbSys(address(100)).arbBlockHash(currentBlock - 1);
        
        // Combine entropy sources including custom seed
        randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    blockHash,
                    currentTimestamp,
                    msg.sender,
                    seed
                )
            )
        );
        
        emit RandomNumberGenerated(
            msg.sender,
            randomNumber,
            currentBlock,
            currentTimestamp
        );
    }
    
    /// @notice Get entropy sources for debugging/verification
    /// @return blockNumber Current block number
    /// @return timestamp Current block timestamp
    /// @return playerAddress Player's address
    /// @return previousBlockHash Hash of previous block
    function getEntropySources() external view returns (
        uint256 blockNumber,
        uint256 timestamp,
        address playerAddress,
        bytes32 previousBlockHash
    ) {
        blockNumber = ArbSys(address(100)).arbBlockNumber();
        timestamp = block.timestamp;
        playerAddress = msg.sender;
        previousBlockHash = ArbSys(address(100)).arbBlockHash(blockNumber - 1);
    }
} 