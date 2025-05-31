const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SessionManagement", function () {
    let testGame;
    let owner;
    let player1;
    let player2;
    let player3;
    let player4;
    let testGameInterface;
    
    // Common test values
    const MIN_BET = ethers.parseEther("0.1");
    const MAX_BET = ethers.parseEther("1.0");
    const DEFAULT_BET = ethers.parseEther("0.5");
    
    beforeEach(async function () {
        [owner, player1, player2, player3, player4] = await ethers.getSigners();
        const TestGame = await ethers.getContractFactory("TestGame");
        testGame = await TestGame.deploy(MIN_BET, MAX_BET, DEFAULT_BET);
        testGameInterface = TestGame.interface;
    });

    describe("1. Session Creation", function () {
        it("should create a session with valid parameters", async function () {
            const minPlayers = 2;
            const maxPlayers = 4;
            const betAmount = MIN_BET;

            const tx = await testGame.connect(player1).createSession(minPlayers, maxPlayers, { value: betAmount });
            const receipt = await tx.wait();
            
            const event = receipt.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCreated');
            
            const sessionId = event.args.sessionId;
            const session = await testGame.sessions(sessionId);
            
            expect(session.minPlayers).to.equal(minPlayers);
            expect(session.maxPlayers).to.equal(maxPlayers);
            expect(session.requiredBet).to.equal(betAmount);
            expect(session.creator).to.equal(player1.address);
            expect(session.status).to.equal(0); // Created
            expect(session.currentPlayers).to.equal(1);
            expect(session.totalPot).to.equal(betAmount);
        });

        it("should not create session with invalid bet amount", async function () {
            const minPlayers = 2;
            const maxPlayers = 4;
            const invalidBet = ethers.parseEther("0.001"); // Below min bet

            await expect(
                testGame.connect(player1).createSession(minPlayers, maxPlayers, { value: invalidBet })
            ).to.be.revertedWith("Bet amount out of range");
        });

        it("should not create session with invalid player limits", async function () {
            const minPlayers = 5;
            const maxPlayers = 4; // Invalid: min > max

            await expect(
                testGame.connect(player1).createSession(minPlayers, maxPlayers, { value: MIN_BET })
            ).to.be.revertedWith("Max players must be >= min players");
        });

        it("should not create session with zero min players", async function () {
            const minPlayers = 0;
            const maxPlayers = 4;

            await expect(
                testGame.connect(player1).createSession(minPlayers, maxPlayers, { value: MIN_BET })
            ).to.be.revertedWith("Min players must be greater than 0");
        });

        it("should allow creating multiple sessions", async function () {
            // Create first session
            const tx1 = await testGame.connect(player1).createSession(2, 4, { value: MIN_BET });
            const receipt1 = await tx1.wait();
            const event1 = receipt1.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCreated');
            const sessionId1 = event1.args.sessionId;

            // Create second session
            const tx2 = await testGame.connect(player2).createSession(2, 4, { value: MIN_BET });
            const receipt2 = await tx2.wait();
            const event2 = receipt2.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCreated');
            const sessionId2 = event2.args.sessionId;

            expect(sessionId2).to.be.gt(sessionId1);
            expect((await testGame.sessions(sessionId1)).creator).to.equal(player1.address);
            expect((await testGame.sessions(sessionId2)).creator).to.equal(player2.address);
        });
    });

    describe("2. Player Management", function () {
        let sessionId;

        beforeEach(async function () {
            const tx = await testGame.connect(player1).createSession(2, 4, { value: MIN_BET });
            const receipt = await tx.wait();
            const event = receipt.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCreated');
            sessionId = event.args.sessionId;
        });

        it("should allow players to join session with correct bet", async function () {
            await testGame.connect(player2).joinSession(sessionId, { value: MIN_BET });
            
            const isPlayer2InSession = await testGame.isPlayerInSession(sessionId, player2.address);
            expect(isPlayer2InSession).to.be.true;

            const session = await testGame.sessions(sessionId);
            expect(session.currentPlayers).to.equal(2);
            expect(session.totalPot).to.equal(MIN_BET * 2n);
        });

        it("should not allow players to join with wrong bet amount", async function () {
            const wrongBet = ethers.parseEther("0.2"); // Different from MIN_BET

            await expect(
                testGame.connect(player2).joinSession(sessionId, { value: wrongBet })
            ).to.be.revertedWith("Incorrect bet amount");
        });

        it("should not allow players to join full session", async function () {
            // Fill the session
            await testGame.connect(player2).joinSession(sessionId, { value: MIN_BET });
            await testGame.connect(player3).joinSession(sessionId, { value: MIN_BET });
            await testGame.connect(player4).joinSession(sessionId, { value: MIN_BET });

            // Try to join when full
            await expect(
                testGame.connect(owner).joinSession(sessionId, { value: MIN_BET })
            ).to.be.revertedWith("Session is full");
        });

        it("should not allow players to join non-existent session", async function () {
            const nonExistentSessionId = 999;

            await expect(
                testGame.connect(player2).joinSession(nonExistentSessionId, { value: MIN_BET })
            ).to.be.revertedWith("Session does not exist");
        });

        it("should not allow players to join twice", async function () {
            await testGame.connect(player2).joinSession(sessionId, { value: MIN_BET });

            await expect(
                testGame.connect(player2).joinSession(sessionId, { value: MIN_BET })
            ).to.be.revertedWith("Player already in an active session");
        });

        it("should allow players to leave before session starts", async function () {
            await testGame.connect(player2).joinSession(sessionId, { value: MIN_BET });
            
            const initialBalance = await ethers.provider.getBalance(player2.address);
            const tx = await testGame.connect(player2).leaveSession(sessionId);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const finalBalance = await ethers.provider.getBalance(player2.address);

            // Check balance change (accounting for gas)
            expect(finalBalance + gasUsed).to.be.gt(initialBalance);
            expect(await testGame.isPlayerInSession(sessionId, player2.address)).to.be.false;
            
            const session = await testGame.sessions(sessionId);
            expect(session.currentPlayers).to.equal(1);
            expect(session.totalPot).to.equal(MIN_BET);
        });

        it("should not allow players to leave non-existent session", async function () {
            const nonExistentSessionId = 999;

            await expect(
                testGame.connect(player2).leaveSession(nonExistentSessionId)
            ).to.be.revertedWith("Session does not exist");
        });

        it("should not allow players to leave session they're not in", async function () {
            await expect(
                testGame.connect(player2).leaveSession(sessionId)
            ).to.be.revertedWith("Not a session player");
        });

        it("should not allow players to leave after session starts", async function () {
            await testGame.connect(player2).joinSession(sessionId, { value: MIN_BET });
            await testGame.connect(player1).startSession(sessionId);

            await expect(
                testGame.connect(player2).leaveSession(sessionId)
            ).to.be.revertedWith("Can only leave before session starts");
        });
    });

    describe("3. Session State Management", function () {
        let sessionId;

        beforeEach(async function () {
            const tx = await testGame.connect(player1).createSession(2, 4, { value: MIN_BET });
            const receipt = await tx.wait();
            const event = receipt.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCreated');
            sessionId = event.args.sessionId;
            await testGame.connect(player2).joinSession(sessionId, { value: MIN_BET });
        });

        it("should start session with enough players", async function () {
            await testGame.connect(player1).startSession(sessionId);
            
            const session = await testGame.sessions(sessionId);
            expect(session.status).to.equal(1); // Started
        });

        it("should not start session without enough players", async function () {
            // Create new session with 3 min players
            const tx = await testGame.connect(player3).createSession(3, 4, { value: MIN_BET });
            const receipt = await tx.wait();
            const event = receipt.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCreated');
            const newSessionId = event.args.sessionId;

            await expect(
                testGame.connect(player3).startSession(newSessionId)
            ).to.be.revertedWith("Not enough players to start");
        });

        it("should not start non-existent session", async function () {
            const nonExistentSessionId = 999;

            await expect(
                testGame.connect(player1).startSession(nonExistentSessionId)
            ).to.be.revertedWith("Session does not exist");
        });

        it("should not start session you didn't create", async function () {
            await expect(
                testGame.connect(player2).startSession(sessionId)
            ).to.be.revertedWith("Not session creator");
        });

        it("should not start session that's already started", async function () {
            await testGame.connect(player1).startSession(sessionId);

            await expect(
                testGame.connect(player1).startSession(sessionId)
            ).to.be.revertedWith("Session must be in Created state");
        });

        it("should correctly check if session can be started", async function () {
            // Check before enough players
            let [canStart, reason] = await testGame.canStartSession(sessionId);
            expect(canStart).to.be.true;
            expect(reason).to.equal("Session can be started");

            // Start session
            await testGame.connect(player1).startSession(sessionId);

            // Check after started
            [canStart, reason] = await testGame.canStartSession(sessionId);
            expect(canStart).to.be.false;
            expect(reason).to.equal("Session must be in Created state");
        });
    });

    describe("4. Session Information", function () {
        let sessionId;

        beforeEach(async function () {
            const tx = await testGame.connect(player1).createSession(2, 4, { value: MIN_BET });
            const receipt = await tx.wait();
            const event = receipt.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCreated');
            sessionId = event.args.sessionId;
            await testGame.connect(player2).joinSession(sessionId, { value: MIN_BET });
        });

        it("should get correct session status", async function () {
            expect(await testGame.getSessionStatus(sessionId)).to.equal(0); // Created
            
            await testGame.connect(player1).startSession(sessionId);
            expect(await testGame.getSessionStatus(sessionId)).to.equal(1); // Started
        });

        it("should get correct session players", async function () {
            const players = await testGame.getSessionPlayers(sessionId);
            expect(players).to.have.lengthOf(2);
            expect(players).to.include(player1.address);
            expect(players).to.include(player2.address);
        });

        it("should get correct session pot", async function () {
            expect(await testGame.getSessionPot(sessionId)).to.equal(MIN_BET * 2n);
        });

        it("should get correct session bet info", async function () {
            const [requiredBet, totalPot] = await testGame.getSessionBetInfo(sessionId);
            expect(requiredBet).to.equal(MIN_BET);
            expect(totalPot).to.equal(MIN_BET * 2n);
        });

        it("should get correct session player counts", async function () {
            const [minRequired, current, maxAllowed] = await testGame.getSessionPlayerCounts(sessionId);
            expect(minRequired).to.equal(2);
            expect(current).to.equal(2);
            expect(maxAllowed).to.equal(4);
        });

        it("should get correct player active session", async function () {
            expect(await testGame.getPlayerActiveSession(player1.address)).to.equal(sessionId);
            expect(await testGame.getPlayerActiveSession(player2.address)).to.equal(sessionId);
            expect(await testGame.getPlayerActiveSession(player3.address)).to.equal(0);
        });

        it("should correctly check if player is in session", async function () {
            expect(await testGame.isPlayerInSession(sessionId, player1.address)).to.be.true;
            expect(await testGame.isPlayerInSession(sessionId, player2.address)).to.be.true;
            expect(await testGame.isPlayerInSession(sessionId, player3.address)).to.be.false;
        });
    });

    describe("5. Active Session Management", function () {
        let sessionId1;
        let sessionId2;

        beforeEach(async function () {
            // Create two sessions
            const tx1 = await testGame.connect(player1).createSession(2, 2, { value: MIN_BET });
            const receipt1 = await tx1.wait();
            const event1 = receipt1.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCreated');
            sessionId1 = event1.args.sessionId;

            const tx2 = await testGame.connect(player2).createSession(2, 2, { value: MIN_BET });
            const receipt2 = await tx2.wait();
            const event2 = receipt2.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCreated');
            sessionId2 = event2.args.sessionId;
        });

        it("should find available sessions", async function () {
            const availableSessions = await testGame.findAvailableSessions();
            expect(availableSessions).to.have.lengthOf(2);
            expect(availableSessions).to.include(sessionId1);
            expect(availableSessions).to.include(sessionId2);
        });

        it("should get available session details", async function () {
            const [sessionIds, requiredBets, currentPlayers, maxPlayers, minPlayers] = 
                await testGame.getAvailableSessionDetails();
            
            expect(sessionIds).to.have.lengthOf(2);
            expect(requiredBets).to.have.lengthOf(2);
            expect(currentPlayers).to.have.lengthOf(2);
            expect(maxPlayers).to.have.lengthOf(2);
            expect(minPlayers).to.have.lengthOf(2);

            // Check first session details
            expect(sessionIds[0]).to.equal(sessionId1);
            expect(requiredBets[0]).to.equal(MIN_BET);
            expect(currentPlayers[0]).to.equal(1);
            expect(maxPlayers[0]).to.equal(2);
            expect(minPlayers[0]).to.equal(2);
        });


        it("should join any available session", async function () {
            const tx = await testGame.connect(player3).joinAnySession({ value: MIN_BET });
            const receipt = await tx.wait();
            
            const event = receipt.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'PlayerJoined');
            
            const joinedSessionId = event.args.sessionId;
            expect(joinedSessionId).to.be.oneOf([sessionId1, sessionId2]);
            expect(await testGame.isPlayerInSession(joinedSessionId, player3.address)).to.be.true;
        });

        it("should not join any session if none available", async function () {
            // Fill both sessions
            await testGame.connect(player4).joinSession(sessionId1, { value: MIN_BET });
            await testGame.connect(player3).joinSession(sessionId2, { value: MIN_BET });
            const availableSessions = await testGame.findAvailableSessions();
            await expect(
                testGame.connect(owner).joinAnySession({ value: MIN_BET })
            ).to.be.revertedWith("No available sessions matching bet amount");
        });

        it("should update session category", async function () {
            const tx = await testGame.connect(player1).updateSessionCategory(
                sessionId1, 
                1  // 1 represents Competitive in the SessionCategory enum
            );
            const receipt = await tx.wait();
            
            const event = receipt.logs
                .map(log => {
                    try {
                        return testGameInterface.parseLog(log);
                    } catch (e) {
                        return null;
                    }
                })
                .find(event => event && event.name === 'SessionCategoryUpdated');
            
            expect(event.args.category).to.equal(1); // Competitive category
            
            const [,,,,, category] = await testGame.getActiveSessionInfo(sessionId1);
            expect(category).to.equal(1); // Competitive category
        });

        it("should set session featured", async function () {
            await testGame.setSessionFeatured(sessionId1, true);
            const [,,,,,,, isFeatured] = await testGame.getActiveSessionInfo(sessionId1);
            expect(isFeatured).to.be.true;
        });

        it("should update session priority", async function () {
            const newPriority = 5;
            await testGame.updateSessionPriority(sessionId1, newPriority);
            
            const [,,,,,, priority] = await testGame.getActiveSessionInfo(sessionId1);
            expect(priority).to.equal(newPriority);
        });

        it("should get active session count", async function () {
            expect(await testGame.getActiveSessionCount()).to.equal(2);
        });

        it("should get active session info", async function () {
            const [requiredBet, currentPlayers, maxPlayers, minPlayers, createdAt, category, priority, isFeatured] = 
                await testGame.getActiveSessionInfo(sessionId1);
            
            expect(requiredBet).to.equal(MIN_BET);
            expect(currentPlayers).to.equal(1);
            expect(maxPlayers).to.equal(2);
            expect(minPlayers).to.equal(2);
            expect(category).to.equal(0);
            expect(priority).to.equal(0);
            expect(isFeatured).to.be.false;
        });

        it("should find available sessions with filters", async function () {
            // Set up test conditions
            await testGame.connect(player1).updateSessionCategory(sessionId1, 1); // Competitive
            await testGame.setSessionFeatured(sessionId1, true);
            
            // Test with filters
            const [sessionIds, requiredBets, currentPlayers, maxPlayers, minPlayers, totalAvailable] = 
                await testGame.findAvailableSessions(
                    0, // startIndex
                    10, // pageSize
                    1, // Competitive category
                    MIN_BET, // minBet
                    MAX_BET, // maxBet
                    true // featuredOnly
                );
            
            expect(totalAvailable).to.equal(1);
            expect(sessionIds).to.have.lengthOf(1);
            expect(sessionIds[0]).to.equal(sessionId1);
            expect(minPlayers[0]).to.equal(2);
            expect(currentPlayers[0]).to.equal(1);
            expect(maxPlayers[0]).to.equal(2);
        });
    });
}); 