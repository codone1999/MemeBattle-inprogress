const GameService = require('../services/Game.service');
const UserRepository = require('../repositories/user.repository');
const GachaService = require('../services/Gacha.service');
const { GameStateHelper } = require('../config/redis');

/**
 * Game Socket Handler
 * Handles all real-time game events via Socket.IO
 */
class GameSocketHandler {
  constructor(io) {
    this.io = io;
    this.gameService = new GameService();
    this.userRepository = new UserRepository();
    this.gachaService = new GachaService();
    this.userSockets = new Map(); // userId -> socket mapping
    this.retryTimeouts = new Map(); // gameId -> timeout ID mapping (in memory, not in DB)
  }

  /**
   * Initialize game socket handlers
   */
  initialize() {
    this.io.on('connection', (socket) => {

      // Verify user authentication
      if (!socket.userId) {
        console.error('Unauthenticated socket connection attempt');
        socket.emit('game:error', { message: 'Authentication required' });
        socket.disconnect();
        return;
      }

      // Store user socket
      this.userSockets.set(socket.userId, socket);

      // Game events
      socket.on('game:join', (data) => this.handleJoinGame(socket, data));
      socket.on('game:dice_roll:submit', (data) => this.handleDiceRoll(socket, data));
      socket.on('game:action:hover', (data) => this.handleCardHover(socket, data));
      socket.on('game:action:play_card', (data) => this.handlePlayCard(socket, data));
      socket.on('game:action:skip_turn', (data) => this.handleSkipTurn(socket, data));
      socket.on('game:action:activate_ability', (data) => this.handleActivateAbility(socket, data));
      socket.on('game:vote_end', (data) => this.handleEndGameVote(socket, data));
      socket.on('game:retry', (data) => this.handleRetryGame(socket, data));
      socket.on('game:leave', (data) => this.handleLeaveGame(socket, data));
      
      // Disconnect
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * Handle player joining game
   */
  async handleJoinGame(socket, data) {
    try {
      const { gameId } = data;
      const userId = socket.userId;

      if (!gameId || !userId) {
        return socket.emit('game:error', { message: 'Invalid game or user ID' });
      }

      // Verify user exists and is authenticated
      const user = await this.userRepository.findById(userId);
      if (!user) {
        console.error(`❌ User ${userId} not found`);
        return socket.emit('game:error', { message: 'User not found' });
      }

      // Get game state
      const gameState = await this.gameService.getGameState(gameId);

      if (!gameState) {
        console.error(`❌ Game ${gameId} not found`);
        return socket.emit('game:error', { message: 'Game not found' });
      }

      // CRITICAL: Verify user is authorized to join this game
      if (!gameState.players[userId]) {
        console.error(`❌ User ${userId} not authorized for game ${gameId}`);
        return socket.emit('game:error', { 
          message: 'You are not authorized to join this game' 
        });
      }

      // Join socket room
      socket.join(gameId);
      socket.gameId = gameId;

      // Store user game mapping
      await GameStateHelper.setUserGame(userId, gameId);

      // Transform state for this player's perspective
      // EACH PLAYER SEES THEMSELVES ON THE LEFT (HOME POSITION)
      const playerState = this._transformStateForPlayerView(gameState, userId);

      // Send initial game state
      socket.emit('game:load', playerState);

      // If in dice roll phase, tell them to roll
      if (gameState.phase === 'dice_roll') {
        const player = gameState.players[userId];
        if (!player.hasRolled) {
          socket.emit('game:dice_roll:start', { message: 'Roll for first turn!' });
        } else {
          socket.emit('game:dice_roll:wait', { 
            myRoll: player.diceRoll,
            message: 'Waiting for opponent...' 
          });
        }
      }

    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('game:error', { message: error.message });
    }
  }

  /**
   * Handle dice roll
   */
  async handleDiceRoll(socket, data) {
    try {
      const gameId = socket.gameId;
      const userId = socket.userId;

      if (!gameId) {
        return socket.emit('game:error', { message: 'Not in a game' });
      }

      const result = await this.gameService.rollDice(gameId, userId);

      if (result.type === 'wait') {
        // Send wait message to this player only
        socket.emit('game:dice_roll:wait', result);
      } else if (result.type === 'tie') {
        // Broadcast tie to both players
        this.io.to(gameId).emit('game:dice_roll:result', result);
        
        // Wait a moment, then tell them to roll again
        setTimeout(() => {
          this.io.to(gameId).emit('game:dice_roll:start', { 
            message: 'Roll again!' 
          });
        }, 2000);
      } else if (result.type === 'result') {
        // Broadcast result and updated game state
        this.io.to(gameId).emit('game:dice_roll:result', result);
        
        // Send updated game state to both players
        await this.broadcastGameState(gameId);
      }
    } catch (error) {
      console.error('Error in dice roll:', error);
      socket.emit('game:error', { message: error.message });
    }
  }

  /**
   * Handle card hover preview
   */
  async handleCardHover(socket, data) {
    try {
      let { cardId, x, y } = data;
      const gameId = socket.gameId;
      const userId = socket.userId;

      if (!gameId) {
        return socket.emit('game:error', { message: 'Not in a game' });
      }

      // Validate coordinates are provided
      if (x === null || x === undefined || y === null || y === undefined) {
        // No hover location, clear preview
        return socket.emit('game:action:preview', {
          isValid: false,
          pawnLocations: [],
          abilityLocations: []
        });
      }

      // Get game state to check player position
      const gameState = await this.gameService.getGameState(gameId);

      if (!gameState) {
        return socket.emit('game:error', { message: 'Game not found' });
      }

      const player = gameState.players[userId];

      if (!player) {
        return socket.emit('game:error', { message: 'Player not in game' });
      }

      // CRITICAL: Transform coordinates if player is away
      if (player.position === 'away') {
        const width = gameState.board[0]?.length || 6;
        const height = gameState.board.length;

        // Flip coordinates 180 degrees
        x = width - 1 - x;
        y = height - 1 - y;
      }

      const preview = await this.gameService.previewCardPlacement(
        gameId,
        userId,
        cardId,
        x,
        y
      );

      // Transform preview locations back to display coordinates if away player
      if (player && player.position === 'away') {
        const width = gameState.board[0].length;
        const height = gameState.board.length;
        
        // Transform pawn locations
        if (preview.pawnLocations) {
          preview.pawnLocations = preview.pawnLocations.map(loc => ({
            x: width - 1 - loc.x,
            y: height - 1 - loc.y
          }));
        }
        
        // Transform ability locations (preserving effectType)
        if (preview.abilityLocations) {
          preview.abilityLocations = preview.abilityLocations.map(loc => ({
            x: width - 1 - loc.x,
            y: height - 1 - loc.y,
            effectType: loc.effectType // Preserve effect type for coloring
          }));
        }
      }

      // Send preview only to this player
      socket.emit('game:action:preview', preview);
    } catch (error) {
      console.error('Error in card hover:', error);
      socket.emit('game:error', { message: error.message });
    }
  }

  /**
   * Handle playing a card
   */
  async handlePlayCard(socket, data) {
    try {
      let { cardId, handCardIndex, x, y } = data;
      const gameId = socket.gameId;
      const userId = socket.userId;

      if (!gameId) {
        return socket.emit('game:error', { message: 'Not in a game' });
      }

      // Validate coordinates
      if (x === null || x === undefined || y === null || y === undefined) {
        return socket.emit('game:error', { message: 'Invalid coordinates' });
      }

      // Get game state to check player position
      const gameState = await this.gameService.getGameState(gameId);

      if (!gameState) {
        return socket.emit('game:error', { message: 'Game not found' });
      }

      const player = gameState.players[userId];

      if (!player) {
        return socket.emit('game:error', { message: 'Player not in game' });
      }

      // CRITICAL: Transform coordinates if player is away
      // Frontend sends display coordinates, we need absolute coordinates
      if (player.position === 'away') {
        const width = gameState.board[0]?.length || 6;
        const height = gameState.board.length;

        // Flip coordinates 180 degrees
        x = width - 1 - x;
        y = height - 1 - y;
        
      }

      const updatedGameState = await this.gameService.playCard(
        gameId,
        userId,
        cardId,
        handCardIndex,
        x,
        y
      );

      // Check if game ended
      if (updatedGameState.phase === 'ended') {
        await this.broadcastGameEnd(gameId, updatedGameState);
      } else {
        // Broadcast updated state to both players
        await this.broadcastGameState(gameId);
      }
    } catch (error) {
      console.error('Error playing card:', error);
      socket.emit('game:error', { message: error.message });
    }
  }

  /**
   * Handle skip turn
   */
  async handleSkipTurn(socket, data) {
    try {
      const gameId = socket.gameId;
      const userId = socket.userId;

      if (!gameId) {
        return socket.emit('game:error', { message: 'Not in a game' });
      }

      const result = await this.gameService.skipTurn(gameId, userId);

      // Check if game ended due to total skips
      if (result.phase === 'ended' && result.endReason === 'total_skips') {
        // Broadcast game end
        const endData = {
          status: 'completed',
          winnerId: result.winner,
          finalScore: {},
          coinsWon: 1, // Winner gets 1 coin
          message: result.endMessage
        };

        Object.keys(result.players).forEach(playerId => {
          endData.finalScore[playerId] = result.players[playerId].totalScore;
        });

        this.io.to(gameId).emit('game:end', endData);

        // Clean up
        await this.cleanupGame(gameId);
      } else {
        // Broadcast updated state
        await this.broadcastGameState(gameId);
      }
    } catch (error) {
      console.error('Error skipping turn:', error);
      socket.emit('game:error', { message: error.message });
    }
  }

  /**
   * Handle end game vote request - Player initiates vote to end game
   */
  async handleEndGameVote(socket, data) {
    try {
      const { gameId, response } = data; // response can be 'request', 'accept', or 'decline'
      const userId = socket.userId;

      if (!gameId) {
        return socket.emit('game:error', { message: 'Invalid game ID' });
      }


      // Get current game state
      const gameState = await this.gameService.getGameState(gameId);

      if (!gameState) {
        return socket.emit('game:error', { message: 'Game not found' });
      }

      // Verify game is playing
      if (gameState.phase !== 'playing') {
        return socket.emit('game:error', { message: 'Game is not in playing phase' });
      }

      // Verify user is a player
      if (!gameState.players[userId]) {
        return socket.emit('game:error', { message: 'You are not a player in this game' });
      }

      // Get both player IDs
      const playerIds = Object.keys(gameState.players);
      const opponentId = playerIds.find(id => id !== userId);
      const opponentSocket = this.userSockets.get(opponentId);
      const requester = gameState.players[userId];

      // Handle different response types
      if (!response || response === 'request') {
        // Player initiates vote - show popup to opponent

        if (opponentSocket) {
          opponentSocket.emit('game:vote_end_request', {
            requesterId: userId,
            requesterName: requester.username || requester.displayName,
            message: `${requester.username || requester.displayName} wants to end the game. Do you agree?`
          });
        }

        // Notify requester that request was sent
        socket.emit('game:vote_end_sent', {
          message: 'End game request sent to opponent'
        });

      } else if (response === 'accept') {
        // Opponent accepted - end the game

        // End the game and calculate scores
        gameState.phase = 'ended';
        gameState.status = 'completed';

        // Calculate final scores (row totals)
        this.gameService._calculateScores(gameState);

        // Determine row winners and calculate final scores
        this.gameService._determineRowWinners(gameState);

        // Mark squares with active effects before ending
        this.gameService._markSquareEffects(gameState);

        // Determine winner
        const players = Object.values(gameState.players);
        let winnerId = null;

        if (players[0].totalScore > players[1].totalScore) {
          winnerId = players[0].userId;
        } else if (players[1].totalScore > players[0].totalScore) {
          winnerId = players[1].userId;
        }
        // If equal, winnerId stays null (draw)

        gameState.winner = winnerId;
        gameState.endResult = {
          winnerId: winnerId,
          reason: 'Both players voted to end the game',
          finalScores: {
            [players[0].userId]: players[0].totalScore,
            [players[1].userId]: players[1].totalScore
          }
        };

        // Award coins to winner (1 coin for early end)
        if (winnerId) {
          const winner = gameState.players[winnerId];
          winner.coinsEarned = 1;
          await this.gachaService.awardCoins(winnerId, 1);
        }

        // Save completed game
        await this.gameService._saveCompletedGame(gameState);

        // Save final state
        await this.gameService.updateGameState(gameId, gameState);

        // Broadcast final state to both players
        playerIds.forEach(playerId => {
          const playerSocket = this.userSockets.get(playerId);
          if (playerSocket) {
            const transformedState = this._transformStateForPlayerView(gameState, playerId);

            // Add end result with coins
            transformedState.endResult = {
              ...gameState.endResult,
              coinsWon: winnerId === playerId ? 1 : 0
            };

            playerSocket.emit('game:state', transformedState);
          }
        });


      } else if (response === 'decline') {
        // Opponent declined - notify both players

        if (opponentSocket) {
          opponentSocket.emit('game:vote_end_declined', {
            message: 'Opponent declined to end the game'
          });
        }

        socket.emit('game:vote_end_declined', {
          message: 'You declined the end game request'
        });
      }

    } catch (error) {
      console.error('Error handling end game vote:', error);
      socket.emit('game:error', { message: error.message || 'Failed to handle end game vote' });
    }
  }

  /**
   * Handle leaving game
   */
  /**
   * Handle retry/rematch game - With popup confirmation
   */
  async handleRetryGame(socket, data) {
    try {
      const { gameId, response } = data; // response can be 'request', 'accept', or 'decline'
      const userId = socket.userId;

      if (!gameId) {
        return socket.emit('game:error', { message: 'Invalid game ID' });
      }


      // Get current game state
      const gameState = await this.gameService.getGameState(gameId);

      if (!gameState) {
        return socket.emit('game:error', { message: 'Game not found' });
      }

      // Verify game has ended
      if (gameState.phase !== 'ended') {
        return socket.emit('game:error', { message: 'Game has not ended yet' });
      }

      // Verify user is a player in this game
      if (!gameState.players[userId]) {
        return socket.emit('game:error', { message: 'You are not a player in this game' });
      }

      const playerIds = Object.keys(gameState.players);
      const opponentId = playerIds.find(id => id !== userId);
      const opponentSocket = this.userSockets.get(opponentId);
      const requester = gameState.players[userId];

      // Handle different response types
      if (!response || response === 'request') {
        // Player initiates retry - show popup to opponent

        if (opponentSocket) {
          opponentSocket.emit('game:retry_request', {
            requesterId: userId,
            requesterName: requester.username || requester.displayName,
            message: `${requester.username || requester.displayName} wants to play again!`
          });
        }

        // Notify requester that request was sent
        socket.emit('game:retry_sent', {
          message: 'Play again request sent to opponent'
        });

      } else if (response === 'accept') {
        // Opponent accepted - start rematch

        // Reset the game
        const newGameState = await this.gameService.retryGame(gameId);

        // Broadcast the reset game state to both players
        const playerAId = playerIds[0];
        const playerBId = playerIds[1];

        // Send transformed state to each player
        const socketA = this.userSockets.get(playerAId);
        const socketB = this.userSockets.get(playerBId);

        if (socketA) {
          socketA.emit('game:state', this._transformStateForPlayerView(newGameState, playerAId));
        }
        if (socketB) {
          socketB.emit('game:state', this._transformStateForPlayerView(newGameState, playerBId));
        }

        // Notify both players to start rolling dice
        this.io.to(gameId).emit('game:dice_roll:start', {
          message: 'Rematch started! Roll for first turn!'
        });


      } else if (response === 'decline') {
        // Opponent declined - notify both players

        if (opponentSocket) {
          opponentSocket.emit('game:retry_declined', {
            message: 'Opponent declined to play again'
          });
        }

        socket.emit('game:retry_declined', {
          message: 'You declined the play again request'
        });
      }
    } catch (error) {
      console.error('Error handling retry game:', error);
      socket.emit('game:error', { message: error.message || 'Failed to handle retry request' });
    }
  }

  /**
   * Handle player leaving game
   */
  async handleLeaveGame(socket, data) {
    try {
      const gameId = socket.gameId;
      const userId = socket.userId;

      if (!gameId) return;


      // Get game state
      const gameState = await this.gameService.getGameState(gameId);

      if (gameState && gameState.phase !== 'ended') {
        // End the game - player who left forfeits
        const player = gameState.players[userId];
        const opponentId = Object.keys(gameState.players).find(id => id !== userId);
        const opponent = gameState.players[opponentId];

        if (player && opponent) {
          // Calculate final scores (row totals)
          this.gameService._calculateScores(gameState);

          // Determine row winners and calculate final scores
          this.gameService._determineRowWinners(gameState);

          // Set opponent as winner (player who left forfeits)
          gameState.phase = 'ended';
          gameState.status = 'abandoned';
          gameState.winner = opponentId;

          // Save the game
          await this.gameService._saveCompletedGame(gameState);

          // Notify opponent and redirect them to lobby
          const opponentSocket = this.userSockets.get(opponentId);
          if (opponentSocket) {
            opponentSocket.emit('game:end', {
              status: 'abandoned',
              winnerId: opponentId,
              finalScore: {
                [userId]: player.totalScore || 0,
                [opponentId]: opponent.totalScore || 0
              },
              coinsWon: 1,
              message: 'Opponent left the game - You win!',
              redirectToLobby: true
            });

            // Give client time to show end screen (3 seconds), then force redirect to lobby list
            setTimeout(() => {
              if (opponentSocket.connected) {
                opponentSocket.emit('game:force_leave', {
                  message: 'Opponent left - Returning to lobby list...'
                });
                // Ensure they leave the game room
                opponentSocket.leave(gameId);
                opponentSocket.gameId = null;
              }
            }, 3000);
          }

        }

        // Clean up the game
        await this.cleanupGame(gameId);
      }

      // Leave socket room
      socket.leave(gameId);
      socket.gameId = null;

      // Delete user game mapping
      await GameStateHelper.deleteUserGame(userId);

    } catch (error) {
      console.error('Error leaving game:', error);
    }
  }

  /**
   * Handle disconnect
   */
  async handleDisconnect(socket) {
    try {
      const userId = socket.userId;
      const gameId = socket.gameId;


      // Remove from user sockets map
      if (userId) {
        this.userSockets.delete(userId);
      }

      // Handle game disconnect - treat same as leaving
      if (gameId && userId) {
        const gameState = await this.gameService.getGameState(gameId);

        if (gameState && gameState.phase !== 'ended') {

          // End the game - disconnected player forfeits
          const player = gameState.players[userId];
          const opponentId = Object.keys(gameState.players).find(id => id !== userId);
          const opponent = gameState.players[opponentId];

          if (player && opponent) {
            // Calculate final scores (row totals)
            this.gameService._calculateScores(gameState);

            // Determine row winners and calculate final scores
            this.gameService._determineRowWinners(gameState);

            // Set opponent as winner
            gameState.phase = 'ended';
            gameState.status = 'abandoned';
            gameState.winner = opponentId;

            // Save the game
            await this.gameService._saveCompletedGame(gameState);

            // Notify opponent and redirect them to lobby
            const opponentSocket = this.userSockets.get(opponentId);
            if (opponentSocket) {
              opponentSocket.emit('game:end', {
                status: 'abandoned',
                winnerId: opponentId,
                finalScore: {
                  [userId]: player.totalScore || 0,
                  [opponentId]: opponent.totalScore || 0
                },
                coinsWon: 1,
                message: 'Opponent disconnected - You win!',
                redirectToLobby: true
              });

              // Give client time to show end screen (3 seconds), then force redirect to lobby list
              setTimeout(() => {
                if (opponentSocket.connected) {
                  opponentSocket.emit('game:force_leave', {
                    message: 'Opponent disconnected - Returning to lobby list...'
                  });
                  // Ensure they leave the game room
                  opponentSocket.leave(gameId);
                  opponentSocket.gameId = null;
                }
              }, 3000);
            }


            // Clean up the game
            await this.cleanupGame(gameId);
          }
        }

        // Clean up user game mapping
        await GameStateHelper.deleteUserGame(userId);
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  }

  /**
   * Broadcast game state to all players in game
   */
  async broadcastGameState(gameId) {
    try {
      const gameState = await this.gameService.getGameState(gameId);

      if (!gameState) return;

      // Send transformed state to each player
      const playerIds = Object.keys(gameState.players);

      for (const playerId of playerIds) {
        const socket = this.userSockets.get(playerId);
        
        if (socket) {
          // Each player gets their own view: they are always on the LEFT
          const transformedState = this._transformStateForPlayerView(gameState, playerId);
          socket.emit('game:state:update', transformedState);
          
        }
      }
    } catch (error) {
      console.error('Error broadcasting game state:', error);
    }
  }

  /**
   * Broadcast game end
   */
  async broadcastGameEnd(gameId, gameState) {
    try {
      const players = Object.values(gameState.players);
      
      // Determine winner
      const winner = players.reduce((prev, current) => 
        current.totalScore > prev.totalScore ? current : prev
      );

      const isDraw = players.every(p => p.totalScore === winner.totalScore);

      const endData = {
        status: 'completed',
        winnerId: isDraw ? null : winner.userId,
        finalScore: {},
        coinsWon: isDraw ? 0 : 2
      };

      players.forEach(player => {
        endData.finalScore[player.userId] = player.totalScore;
      });

      // Broadcast to all players in game
      this.io.to(gameId).emit('game:end', endData);

      // Clean up
      await this.cleanupGame(gameId);
    } catch (error) {
      console.error('Error broadcasting game end:', error);
    }
  }

  /**
   * Transform game state for specific player view
   * CRITICAL: Each player always sees themselves on the LEFT (home position)
   * and their opponent on the RIGHT (away position)
   * 
   * @param {Object} gameState - Original game state from Redis
   * @param {string} viewingPlayerId - The player viewing this state
   * @returns {Object} - Transformed state for this player's view
   */
  _transformStateForPlayerView(gameState, viewingPlayerId) {
    // Get both players
    const myPlayer = gameState.players[viewingPlayerId];
    const opponentId = Object.keys(gameState.players).find(id => id !== viewingPlayerId);
    const opponentPlayer = gameState.players[opponentId];

    if (!myPlayer || !opponentPlayer) {
      console.error('Cannot transform state: Missing player data');
      return gameState;
    }

    // Create base transformed state
    const transformed = {
      gameId: gameState.gameId,
      status: gameState.status,
      phase: gameState.phase,
      currentTurn: gameState.currentTurn,
      turnNumber: gameState.turnNumber,
      settings: gameState.settings,
      createdAt: gameState.createdAt
    };

    // BOARD TRANSFORMATION CHECK
    // If viewing player is the "away" player in absolute storage,
    // we need to flip the board 180 degrees AND reverse row scores
    const isAwayPlayer = myPlayer.position === 'away';

    // Reverse row scores if board is flipped (for away player)
    // When board is flipped 180°, row 0 appears at bottom (visual position 2)
    // So rowScores must be reversed: [row0, row1, row2] -> [row2, row1, row0]
    const myRowScores = isAwayPlayer
      ? [myPlayer.rowScores[2], myPlayer.rowScores[1], myPlayer.rowScores[0]]
      : myPlayer.rowScores;

    const opponentRowScores = isAwayPlayer
      ? [opponentPlayer.rowScores[2], opponentPlayer.rowScores[1], opponentPlayer.rowScores[0]]
      : opponentPlayer.rowScores;

    // Transform Tifa boosted rows if player is away (board is flipped)
    const myTifaBoostedRows = isAwayPlayer && myPlayer.tifaBoostedRows
      ? myPlayer.tifaBoostedRows.map(row => 2 - row) // Flip: 0->2, 1->1, 2->0
      : myPlayer.tifaBoostedRows || [];

    const myTifaCardCount = isAwayPlayer && myPlayer.tifaCardCount
      ? { 0: myPlayer.tifaCardCount[2], 1: myPlayer.tifaCardCount[1], 2: myPlayer.tifaCardCount[0] }
      : myPlayer.tifaCardCount || { 0: 0, 1: 0, 2: 0 };

    // MY PLAYER DATA (Always on LEFT/HOME position in UI)
    transformed.me = {
      userId: myPlayer.userId,
      username: myPlayer.username,
      displayName: myPlayer.displayName,
      profilePic: myPlayer.profilePic,
      position: 'left', // UI position: LEFT side
      character: myPlayer.character,
      hand: myPlayer.hand, // Send full hand to owner
      deckCount: myPlayer.deck.length,
      totalScore: myPlayer.totalScore,
      rowScores: myRowScores,
      diceRoll: myPlayer.diceRoll,
      hasRolled: myPlayer.hasRolled,
      abilityUsesRemaining: myPlayer.abilityUsesRemaining || 0,
      activeRowMultipliers: myPlayer.activeRowMultipliers || {},
      tifaBoostedRows: myTifaBoostedRows,
      tifaCardCount: myTifaCardCount
    };

    // OPPONENT PLAYER DATA (Always on RIGHT/AWAY position in UI)
    transformed.opponent = {
      userId: opponentPlayer.userId,
      username: opponentPlayer.username,
      displayName: opponentPlayer.displayName,
      profilePic: opponentPlayer.profilePic,
      position: 'right', // UI position: RIGHT side
      character: opponentPlayer.character,
      handCount: opponentPlayer.hand.length, // Don't send opponent's cards
      deckCount: opponentPlayer.deck.length,
      totalScore: opponentPlayer.totalScore,
      rowScores: opponentRowScores,
      diceRoll: opponentPlayer.diceRoll,
      hasRolled: opponentPlayer.hasRolled,
      abilityUsesRemaining: opponentPlayer.abilityUsesRemaining || 0,
      activeRowMultipliers: opponentPlayer.activeRowMultipliers || {}
    };
    
    if (isAwayPlayer) {
      // Flip board 180 degrees for away player
      transformed.board = this._flipBoard180(gameState.board, viewingPlayerId, opponentId);
    } else {
      // Home player sees normal board, but still need to set owner labels
      transformed.board = this._setBoardOwnerLabels(gameState.board, viewingPlayerId, opponentId);
    }

    return transformed;
  }

  /**
   * Flip board 180 degrees (for away player)
   * @private
   */
  _flipBoard180(board, myPlayerId, opponentId) {
    const height = board.length;
    const width = board[0].length;
    const flipped = Array(height).fill(null).map(() => Array(width).fill(null));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const newY = height - 1 - y; // Flip vertically
        const newX = width - 1 - x;  // Flip horizontally
        
        const originalSquare = board[y][x];

        // Transform ownership labels
        let ownerLabel = null;
        if (originalSquare.owner === myPlayerId) {
          ownerLabel = 'me';
        } else if (originalSquare.owner === opponentId) {
          ownerLabel = 'opponent';
        }

        // Create pawns object based on owner
        const pawns = {};
        if (originalSquare.owner === myPlayerId) {
          pawns.me = originalSquare.pawnCount || 0;
        } else if (originalSquare.owner === opponentId) {
          pawns.opponent = originalSquare.pawnCount || 0;
        }

        flipped[newY][newX] = {
          x: newX,
          y: newY,
          card: originalSquare.card,
          owner: ownerLabel,
          pawns: pawns,
          pawnCount: originalSquare.pawnCount || 0,
          special: originalSquare.special,
          activeEffects: originalSquare.activeEffects || []
        };
      }
    }

    return flipped;
  }

  /**
   * Set board owner labels without flipping (for home player)
   * @private
   */
  _setBoardOwnerLabels(board, myPlayerId, opponentId) {
    return board.map(row =>
      row.map(square => {
        // Transform owner ID to label
        const ownerLabel = square.owner === myPlayerId ? 'me' :
                          square.owner === opponentId ? 'opponent' : null;

        // Create pawns object based on owner
        const pawns = {};
        if (square.owner === myPlayerId) {
          pawns.me = square.pawnCount || 0;
        } else if (square.owner === opponentId) {
          pawns.opponent = square.pawnCount || 0;
        }

        return {
          x: square.x,
          y: square.y,
          card: square.card,
          owner: ownerLabel,
          pawns: pawns,
          pawnCount: square.pawnCount || 0,
          special: square.special,
          activeEffects: square.activeEffects || []
        };
      })
    );
  }

  /**
   * Clean up game after completion
   */
  async cleanupGame(gameId) {
    try {
      // Get all sockets in this room
      const room = this.io.sockets.adapter.rooms.get(gameId);
      
      if (room) {
        // Make all sockets leave the room
        room.forEach(socketId => {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.leave(gameId);
            socket.gameId = null;
          }
        });
      }

      // Delete game state from Redis
      await GameStateHelper.deleteGameState(gameId);
      await GameStateHelper.deleteGameRoom(gameId);

    } catch (error) {
      console.error('Error cleaning up game:', error);
    }
  }

  /**
   * Handle activate ability (for Tifa's Somersault)
   */
  async handleActivateAbility(socket, data) {
    try {
      const { gameId, rowIndex } = data;
      const userId = socket.userId;


      // Get game state
      const gameState = await this.gameService.getGameState(gameId);

      if (!gameState) {
        socket.emit('game:error', { message: 'Game not found' });
        return;
      }

      const player = gameState.players[userId];

      if (!player) {
        socket.emit('game:error', { message: 'You are not in this game' });
        return;
      }

      // Verify it's an active ability
      if (player.character?.abilities?.abilityType !== 'active') {
        socket.emit('game:error', { message: 'Your character does not have an active ability' });
        return;
      }

      // Check if player has uses remaining
      if (player.abilityUsesRemaining <= 0) {
        socket.emit('game:error', { message: 'No ability uses remaining' });
        return;
      }

      // Validate row index
      if (rowIndex < 0 || rowIndex > 2) {
        socket.emit('game:error', { message: 'Invalid row index' });
        return;
      }

      // Check if this row already has a multiplier active
      if (player.activeRowMultipliers[rowIndex]) {
        socket.emit('game:error', { message: 'This row already has an active multiplier' });
        return;
      }

      // Apply the ability
      const multiplierValue = player.character.abilities.effects[0].value;
      player.activeRowMultipliers[rowIndex] = multiplierValue;
      player.abilityUsesRemaining -= 1;

      // Recalculate scores with the new multiplier
      this.gameService._calculateScores(gameState);

      // Save updated game state
      await this.gameService.saveGameState(gameState);

      // Broadcast the updated state to both players
      await this.broadcastGameState(gameId, gameState);


    } catch (error) {
      console.error('Error activating ability:', error);
      socket.emit('game:error', { message: 'Failed to activate ability' });
    }
  }

  /**
   * Get socket by user ID
   */
  getSocketByUserId(userId) {
    return this.userSockets.get(userId);
  }
}

module.exports = GameSocketHandler;