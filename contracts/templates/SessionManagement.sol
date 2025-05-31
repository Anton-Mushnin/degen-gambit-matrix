// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SessionManagement
 * @dev Template contract for managing game sessions in multiplayer web3 games with betting
 * This contract provides base functionality for session creation, player management,
 * and session state tracking. It is designed to be inherited by game-specific contracts.
 */
abstract contract SessionManagement is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Session status enum
    enum SessionStatus {
        Created,    // Session created, accepting players and bets
        Started,    // Session started, no more players can join
        Ended       // Session has ended, rewards distributed
    }

    // Player struct to track player state within a session
    struct Player {
        address playerAddress;
        bool isActive;
        uint256 joinedAt;
        uint256 lastActiveAt;
    }

    // Session struct to store session data
    struct Session {
        uint256 sessionId;
        address creator;
        SessionStatus status;
        uint256 createdAt;
        uint256 startedAt;
        uint256 endedAt;
        uint256 minPlayers;    // Minimum players required to start
        uint256 maxPlayers;    // Maximum players allowed
        uint256 currentPlayers;
        uint256 requiredBet;   // Required bet amount for each player (0 for no bet)
        uint256 totalPot;      // Total amount in the pot
        mapping(address => Player) players;
        address[] playerAddresses; // Array to track all players for iteration
    }

    // New structures for active session management
    struct ActiveSessionInfo {
        uint256 sessionId;
        uint256 requiredBet;
        uint256 currentPlayers;
        uint256 maxPlayers;
        uint256 minPlayers;      // Added minPlayers
        uint256 createdAt;
        uint256 category;      // Session category (0 = default)
        uint256 priority;      // Session priority (higher = more important)
        bool isFeatured;       // Featured sessions get priority in listings
    }

    // Session categories
    enum SessionCategory {
        Default,
        Competitive,
        Casual,
        Tournament,
        Practice
    }

    // Events
    event SessionCreated(
        uint256 indexed sessionId, 
        address indexed creator, 
        uint256 minPlayers, 
        uint256 maxPlayers,
        uint256 requiredBet
    );
    event SessionStarted(uint256 indexed sessionId);
    event PlayerJoined(uint256 indexed sessionId, address indexed player, uint256 betAmount);
    event PlayerLeft(uint256 indexed sessionId, address indexed player);
    event RewardsDistributed(uint256 indexed sessionId, address[] winners, uint256[] amounts);
    event SessionCategoryUpdated(uint256 indexed sessionId, SessionCategory category);
    event SessionFeatured(uint256 indexed sessionId, bool isFeatured);
    event SessionPriorityUpdated(uint256 indexed sessionId, uint256 priority);

    // State variables
    Counters.Counter private _sessionIds;
    mapping(uint256 => Session) public sessions;
    mapping(address => uint256) public activeSessionId; // Track player's active session (0 means no active session)

    // Bet limits
    uint256 public immutable MIN_BET;  // Minimum bet amount
    uint256 public immutable MAX_BET;  // Maximum bet amount
    uint256 public immutable DEFAULT_BET;  // Default bet amount for auto-join

    // State variables for active session management
    mapping(uint256 => ActiveSessionInfo) private activeSessions;
    uint256[] private activeSessionIds;
    uint256 private activeSessionCount;

    modifier sessionExists(uint256 sessionId) {
        require(sessions[sessionId].sessionId != 0, "Session does not exist");
        _;
    }

    modifier sessionActive(uint256 sessionId) {
        require(sessions[sessionId].status == SessionStatus.Started, "Session is not active");
        _;
    }

    modifier isSessionPlayer(uint256 sessionId) {
        require(sessions[sessionId].players[msg.sender].isActive, "Not a session player");
        _;
    }

    modifier isSessionCreator(uint256 sessionId) {
        require(sessions[sessionId].creator == msg.sender, "Not session creator");
        _;
    }

    modifier notInAnyActiveSession() {
        require(activeSessionId[msg.sender] == 0, "Player already in an active session");
        _;
    }

    modifier validBetAmount() {
        require(msg.value >= MIN_BET && msg.value <= MAX_BET, "Bet amount out of range");
        _;
    }

    constructor(
        uint256 minBet, 
        uint256 maxBet, 
        uint256 defaultBet
    ) {
        require(minBet < maxBet, "Min bet must be less than max bet");
        require(maxBet <= 100 ether, "Max bet too high");    // Prevent excessive bets
        require(defaultBet >= minBet && defaultBet <= maxBet, "Default bet out of range");
        MIN_BET = minBet;
        MAX_BET = maxBet;
        DEFAULT_BET = defaultBet;
    }

    function createSession(
        uint256 minPlayers, 
        uint256 maxPlayers
    ) public payable notInAnyActiveSession validBetAmount returns (uint256) {
        require(minPlayers > 0, "Min players must be greater than 0");
        require(maxPlayers >= minPlayers, "Max players must be >= min players");
        
        _sessionIds.increment();
        uint256 newSessionId = _sessionIds.current();
        
        Session storage newSession = sessions[newSessionId];
        newSession.sessionId = newSessionId;
        newSession.creator = msg.sender;
        newSession.status = SessionStatus.Created;
        newSession.createdAt = block.timestamp;
        newSession.minPlayers = minPlayers;
        newSession.maxPlayers = maxPlayers;
        newSession.currentPlayers = 1; // Creator is first player
        newSession.requiredBet = msg.value; // Use msg.value as required bet
        newSession.totalPot = msg.value;

        // Add creator as first player
        newSession.players[msg.sender] = Player({
            playerAddress: msg.sender,
            isActive: true,
            joinedAt: block.timestamp,
            lastActiveAt: block.timestamp
        });
        newSession.playerAddresses.push(msg.sender);
        activeSessionId[msg.sender] = newSessionId;
        _activateSession(newSessionId);

        emit SessionCreated(newSessionId, msg.sender, minPlayers, maxPlayers, msg.value);
        emit PlayerJoined(newSessionId, msg.sender, msg.value);
        return newSessionId;
    }

    function startSession(uint256 sessionId) 
        public 
        sessionExists(sessionId)
        isSessionCreator(sessionId)
    {
        Session storage session = sessions[sessionId];
        require(session.status == SessionStatus.Created, "Session must be in Created state");
        require(session.currentPlayers >= session.minPlayers, "Not enough players to start");
        
        session.status = SessionStatus.Started;
        session.startedAt = block.timestamp;
        
        emit SessionStarted(sessionId);
    }

    function canStartSession(uint256 sessionId) 
        public 
        view 
        sessionExists(sessionId) 
        returns (bool, string memory)
    {
        Session storage session = sessions[sessionId];
        if (session.status != SessionStatus.Created) {
            return (false, "Session must be in Created state");
        }
        if (session.currentPlayers < session.minPlayers) {
            return (false, "Not enough players to start");
        }
        return (true, "Session can be started");
    }

    function getSessionPlayerCounts(uint256 sessionId) 
        public 
        view 
        sessionExists(sessionId) 
        returns (uint256 minRequired, uint256 current, uint256 maxAllowed)
    {
        Session storage session = sessions[sessionId];
        return (session.minPlayers, session.currentPlayers, session.maxPlayers);
    }

    function getSessionPot(uint256 sessionId) 
        public 
        view 
        sessionExists(sessionId) 
        returns (uint256)
    {
        return sessions[sessionId].totalPot;
    }

    function getSessionBetInfo(uint256 sessionId) 
        public 
        view 
        sessionExists(sessionId) 
        returns (uint256 requiredBet, uint256 totalPot)
    {
        Session storage session = sessions[sessionId];
        return (session.requiredBet, session.totalPot);
    }

    function joinSession(uint256 sessionId) 
        public 
        payable 
        nonReentrant 
        notInAnyActiveSession
    {
        Session storage session = sessions[sessionId];
        require(session.sessionId != 0, "Session does not exist");
        require(session.status == SessionStatus.Created, "Session not accepting players");
        require(session.currentPlayers < session.maxPlayers, "Session is full");
        require(msg.value == session.requiredBet, "Incorrect bet amount");

        session.players[msg.sender] = Player({
            playerAddress: msg.sender,
            isActive: true,
            joinedAt: block.timestamp,
            lastActiveAt: block.timestamp
        });
        
        session.playerAddresses.push(msg.sender);
        session.currentPlayers++;
        session.totalPot += session.requiredBet;
        activeSessionId[msg.sender] = sessionId;  // Set active session

        emit PlayerJoined(sessionId, msg.sender, session.requiredBet);
    }

    function leaveSession(uint256 sessionId) 
        public 
        sessionExists(sessionId)
        isSessionPlayer(sessionId)
    {
        Session storage session = sessions[sessionId];
        require(session.status == SessionStatus.Created, "Can only leave before session starts");
        
        // Return bet if any
        if (session.requiredBet > 0) {
            session.totalPot -= session.requiredBet;
            (bool success, ) = msg.sender.call{value: session.requiredBet}("");
            require(success, "ETH return failed");
        }

        _removePlayerFromSession(sessionId, msg.sender);
        activeSessionId[msg.sender] = 0;  // Clear active session
        emit PlayerLeft(sessionId, msg.sender);

        // If this was the last player, end the session
        if (session.currentPlayers == 0) {
            session.status = SessionStatus.Ended;
            session.endedAt = block.timestamp;
            _deactivateSession(sessionId);
        }
    }

    function _removePlayerFromSession(uint256 sessionId, address player) internal {
        Session storage session = sessions[sessionId];
        
        // Remove from players mapping
        delete session.players[player];
        
        // Remove from playerAddresses array
        for (uint256 i = 0; i < session.playerAddresses.length; i++) {
            if (session.playerAddresses[i] == player) {
                session.playerAddresses[i] = session.playerAddresses[session.playerAddresses.length - 1];
                session.playerAddresses.pop();
                break;
            }
        }
        
        session.currentPlayers--;
        activeSessionId[player] = 0;  // Clear active session
    }

    function getSessionPlayers(uint256 sessionId) 
        public 
        view 
        sessionExists(sessionId) 
        returns (address[] memory)
    {
        return sessions[sessionId].playerAddresses;
    }

    function getPlayerActiveSession(address player) 
        public 
        view 
        returns (uint256)
    {
        return activeSessionId[player];
    }

    function isPlayerInSession(uint256 sessionId, address player) 
        public 
        view 
        sessionExists(sessionId) 
        returns (bool)
    {
        return sessions[sessionId].players[player].isActive;
    }

    function getSessionStatus(uint256 sessionId) 
        public 
        view 
        sessionExists(sessionId) 
        returns (SessionStatus)
    {
        return sessions[sessionId].status;
    }

    function updatePlayerActivity(uint256 sessionId) 
        public 
        virtual 
        sessionExists(sessionId) 
        isSessionPlayer(sessionId)
    {
        sessions[sessionId].players[msg.sender].lastActiveAt = block.timestamp;
    }

    function canJoinSession(uint256 sessionId, address player) 
        public 
        view 
        virtual 
        returns (bool)
    {
        return true;
    }

    function distributeRewards(uint256 sessionId, address[] memory winners, uint256[] memory amounts) 
        internal 
        virtual 
    {
        Session storage session = sessions[sessionId];
        require(session.status == SessionStatus.Started, "Session must be started");
        require(winners.length == amounts.length, "Winners and amounts length mismatch");
        
        uint256 totalDistributed = 0;
        for (uint256 i = 0; i < winners.length; i++) {
            require(session.players[winners[i]].isActive, "Winner must be active player");
            totalDistributed += amounts[i];
        }
        require(totalDistributed <= session.totalPot, "Cannot distribute more than pot");

        // Distribute ETH
        for (uint256 i = 0; i < winners.length; i++) {
            (bool success, ) = winners[i].call{value: amounts[i]}("");
            require(success, "ETH transfer failed");
        }

        session.status = SessionStatus.Ended;
        session.endedAt = block.timestamp;
        _deactivateSession(sessionId);  // Move to inactive sessions
        emit RewardsDistributed(sessionId, winners, amounts);
    }

    function joinAnySession() 
        public 
        payable 
        nonReentrant 
        notInAnyActiveSession
        validBetAmount
        returns (uint256)
    {
        // Find first available session
        uint256 currentSessionId = _sessionIds.current();
        for (uint256 i = 1; i <= currentSessionId; i++) {
            Session storage session = sessions[i];
            if (
                session.status == SessionStatus.Created && 
                session.currentPlayers < session.maxPlayers &&
                session.requiredBet == msg.value
            ) {
                // Found available session, join it
                require(!session.players[msg.sender].isActive, "Already in session");

                session.players[msg.sender] = Player({
                    playerAddress: msg.sender,
                    isActive: true,
                    joinedAt: block.timestamp,
                    lastActiveAt: block.timestamp
                });
                
                session.playerAddresses.push(msg.sender);
                session.currentPlayers++;
                session.totalPot += msg.value;
                activeSessionId[msg.sender] = i;

                emit PlayerJoined(i, msg.sender, msg.value);
                return i;
            }
        }
        revert("No available sessions matching bet amount");
    }

    function findAvailableSessions() 
        public 
        view 
        returns (uint256[] memory)
    {
        uint256 currentSessionId = _sessionIds.current();
        uint256 availableCount = 0;
        
        // First count available sessions
        for (uint256 i = 1; i <= currentSessionId; i++) {
            Session storage session = sessions[i];
            if (
                session.status == SessionStatus.Created && 
                session.currentPlayers < session.maxPlayers
            ) {
                availableCount++;
            }
        }

        // Then collect their IDs
        uint256[] memory availableSessions = new uint256[](availableCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= currentSessionId; i++) {
            Session storage session = sessions[i];
            if (
                session.status == SessionStatus.Created && 
                session.currentPlayers < session.maxPlayers
            ) {
                availableSessions[index] = i;
                index++;
            }
        }
        return availableSessions;
    }

    function getAvailableSessionDetails() 
        public 
        view 
        returns (
            uint256[] memory sessionIds,
            uint256[] memory requiredBets,
            uint256[] memory currentPlayers,
            uint256[] memory maxPlayers,
            uint256[] memory minPlayers
        )
    {
        uint256[] memory available = findAvailableSessions();
        uint256 count = available.length;
        
        sessionIds = new uint256[](count);
        requiredBets = new uint256[](count);
        currentPlayers = new uint256[](count);
        maxPlayers = new uint256[](count);
        minPlayers = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            Session storage session = sessions[available[i]];
            sessionIds[i] = available[i];
            requiredBets[i] = session.requiredBet;
            currentPlayers[i] = session.currentPlayers;
            maxPlayers[i] = session.maxPlayers;
            minPlayers[i] = session.minPlayers;
        }
    }

    function getDefaultBet() public view returns (uint256) {
        return DEFAULT_BET;
    }

    // function getAvailableSessionDetailsWithDefaultBet() 
    //     public 
    //     view 
    //     returns (
    //         uint256[] memory sessionIds,
    //         uint256[] memory requiredBets,
    //         uint256[] memory currentPlayers,
    //         uint256[] memory maxPlayers,
    //         uint256[] memory minPlayers,
    //     )
    // {
    //     (sessionIds, requiredBets, currentPlayers, maxPlayers, minPlayers) = getAvailableSessionDetails();
    //     return (sessionIds, requiredBets, currentPlayers, maxPlayers, minPlayers, DEFAULT_BET);
    // }

    function _activateSession(uint256 sessionId) internal {
        Session storage session = sessions[sessionId];
        require(session.sessionId != 0, "Session does not exist");
        require(activeSessions[sessionId].sessionId == 0, "Session already active");

        activeSessions[sessionId] = ActiveSessionInfo({
            sessionId: sessionId,
            requiredBet: session.requiredBet,
            currentPlayers: session.currentPlayers,
            maxPlayers: session.maxPlayers,
            minPlayers: session.minPlayers,      // Added minPlayers
            createdAt: block.timestamp,
            category: uint256(SessionCategory.Default),
            priority: 0,
            isFeatured: false
        });
        activeSessionIds.push(sessionId);
        activeSessionCount++;
    }

    function _deactivateSession(uint256 sessionId) internal {
        require(activeSessions[sessionId].sessionId != 0, "Session not active");
        
        // Remove from active list
        uint256 lastIndex = activeSessionIds.length - 1;
        for (uint256 i = 0; i < activeSessionIds.length; i++) {
            if (activeSessionIds[i] == sessionId) {
                activeSessionIds[i] = activeSessionIds[lastIndex];
                activeSessionIds.pop();
                break;
            }
        }
        delete activeSessions[sessionId];
        activeSessionCount--;
    }

    function findAvailableSessions(
        uint256 startIndex,
        uint256 pageSize,
        SessionCategory category,
        uint256 minBet,
        uint256 maxBet,
        bool featuredOnly
    ) public view returns (
        uint256[] memory sessionIds,
        uint256[] memory requiredBets,
        uint256[] memory currentPlayers,
        uint256[] memory maxPlayers,
        uint256[] memory minPlayers,      // Added minPlayers
        uint256 totalAvailable
    ) {
        // First count matching sessions
        uint256 matchingCount = 0;
        for (uint256 i = 0; i < activeSessionIds.length; i++) {
            ActiveSessionInfo storage info = activeSessions[activeSessionIds[i]];
            if (_matchesFilter(info, category, minBet, maxBet, featuredOnly)) {
                matchingCount++;
            }
        }
        
        // Calculate actual page size
        uint256 actualPageSize = pageSize;
        if (startIndex + pageSize > matchingCount) {
            actualPageSize = matchingCount - startIndex;
        }
        
        // Initialize return arrays
        sessionIds = new uint256[](actualPageSize);
        requiredBets = new uint256[](actualPageSize);
        currentPlayers = new uint256[](actualPageSize);
        maxPlayers = new uint256[](actualPageSize);
        minPlayers = new uint256[](actualPageSize);      // Initialize minPlayers array
        
        // Collect matching sessions
        uint256 found = 0;
        uint256 index = 0;
        for (uint256 i = 0; i < activeSessionIds.length && index < actualPageSize; i++) {
            ActiveSessionInfo storage info = activeSessions[activeSessionIds[i]];
            if (_matchesFilter(info, category, minBet, maxBet, featuredOnly)) {
                if (found >= startIndex) {
                    sessionIds[index] = info.sessionId;
                    requiredBets[index] = info.requiredBet;
                    currentPlayers[index] = info.currentPlayers;
                    maxPlayers[index] = info.maxPlayers;
                    minPlayers[index] = info.minPlayers;      // Add minPlayers to return
                    index++;
                }
                found++;
            }
        }
        
        return (sessionIds, requiredBets, currentPlayers, maxPlayers, minPlayers, matchingCount);
    }

    function _matchesFilter(
        ActiveSessionInfo storage info,
        SessionCategory category,
        uint256 minBet,
        uint256 maxBet,
        bool featuredOnly
    ) internal view returns (bool) {
        if (featuredOnly && !info.isFeatured) return false;
        if (category != SessionCategory.Default && info.category != uint256(category)) return false;
        if (info.requiredBet < minBet || info.requiredBet > maxBet) return false;
        return true;
    }

    function updateSessionCategory(uint256 sessionId, SessionCategory category) 
        public 
        sessionExists(sessionId)
        isSessionCreator(sessionId)
    {
        require(activeSessions[sessionId].sessionId != 0, "Session not active");
        activeSessions[sessionId].category = uint256(category);
        emit SessionCategoryUpdated(sessionId, category);
    }

    function setSessionFeatured(uint256 sessionId, bool isFeatured) 
        public 
        onlyOwner
        sessionExists(sessionId)
    {
        require(activeSessions[sessionId].sessionId != 0, "Session not active");
        activeSessions[sessionId].isFeatured = isFeatured;
        emit SessionFeatured(sessionId, isFeatured);
    }

    function updateSessionPriority(uint256 sessionId, uint256 priority) 
        public 
        onlyOwner
        sessionExists(sessionId)
    {
        require(activeSessions[sessionId].sessionId != 0, "Session not active");
        activeSessions[sessionId].priority = priority;
        emit SessionPriorityUpdated(sessionId, priority);
    }

    function getActiveSessionCount() public view returns (uint256) {
        return activeSessionCount;
    }

    function getActiveSessionInfo(uint256 sessionId) 
        public 
        view 
        returns (
            uint256 requiredBet,
            uint256 currentPlayers,
            uint256 maxPlayers,
            uint256 minPlayers,      // Added minPlayers
            uint256 createdAt,
            SessionCategory category,
            uint256 priority,
            bool isFeatured
        )
    {
        ActiveSessionInfo storage info = activeSessions[sessionId];
        require(info.sessionId != 0, "Session not active");
        return (
            info.requiredBet,
            info.currentPlayers,
            info.maxPlayers,
            info.minPlayers,      // Added minPlayers
            info.createdAt,
            SessionCategory(info.category),
            info.priority,
            info.isFeatured
        );
    }

    // Internal function for game contract to remove players after game logic
    function removePlayerFromSession(uint256 sessionId, address player) 
        internal 
        sessionExists(sessionId)
    {
        Session storage session = sessions[sessionId];
        require(session.players[player].isActive, "Player not in session");

        _removePlayerFromSession(sessionId, player);
        activeSessionId[player] = 0;  // Clear active session
        emit PlayerLeft(sessionId, player);

        // If this was the last player, end the session
        if (session.currentPlayers == 0) {
            session.status = SessionStatus.Ended;
            session.endedAt = block.timestamp;
            _deactivateSession(sessionId);
        }
    }
} 