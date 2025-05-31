// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../templates/SessionManagement.sol";

/**
 * @title TestGame
 * @dev Test contract that inherits from SessionManagement for testing purposes
 */
contract TestGame is SessionManagement {
    constructor(
        uint256 minBet,
        uint256 maxBet,
        uint256 defaultBet
    ) SessionManagement(minBet, maxBet, defaultBet) {}

    // Expose internal functions for testing
    function distributeRewards(
        uint256 sessionId,
        address[] memory winners,
        uint256[] memory amounts
    ) internal override {
        super.distributeRewards(sessionId, winners, amounts);
    }

    // Override virtual functions
    function updatePlayerActivity(uint256 sessionId) public override {
        super.updatePlayerActivity(sessionId);
    }

    function canJoinSession(uint256 sessionId, address player) public view override returns (bool) {
        return super.canJoinSession(sessionId, player);
    }

    // Test helper function to distribute rewards
    function testDistributeRewards(
        uint256 sessionId, 
        address[] memory winners, 
        uint256[] memory amounts
    ) public {
        distributeRewards(sessionId, winners, amounts);
    }

    // Test helper function to remove player
    function testRemovePlayer(uint256 sessionId, address player) public {
        removePlayerFromSession(sessionId, player);
    }
} 