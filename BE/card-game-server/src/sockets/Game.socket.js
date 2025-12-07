const GameService = require('../services/Game.service');
const UserRepository = require('../repositories/user.repository');
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
    this.userSockets = new Map(); // userId -> socket mapping
  }

  /**
   * Initialize game socket handlers
   */
  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`🎮 Game socket connected: ${socket.id}`);

      // Verify user authentication
      if (!socket.userId) {
        console.error('❌ Unauthenticated socket connection attempt');
        socket.emit('game:error', { message: 'Authentication required' });
        socket.disconnect();
        return;
      }

      // Store user socket
      this.userSockets.set(socket.userId, socket);
      console.log(`✅ User ${socket.userId} authenticated and connected`);

      // Game events
      socket.on('game:join', (data) => this.handleJoinGame(socket, data));
      socket.on('game:dice_roll:submit', (data) => this.handleDiceRoll(socket, data));
      socket.on('game:action:hover', (data) => this.handleCardHover(socket, data));
      socket.on('game:action:play_card', (data) => this.handlePlayCard(socket, data));
      socket.on('game:action:skip_turn', (data) => this.handleSkipTurn(socket, data));
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

      console.log(`✅ User ${user.username} (${userId}) joined game ${gameId}`);
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

      // Get game state to check player position
      const gameState = await this.gameService.getGameState(gameId);
      const player = gameState.players[userId];

      // CRITICAL: Transform coordinates if player is away
      if (player && player.position === 'away') {
        const width = gameState.board[0].length;
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
        
        // Transform effect locations
        if (preview.effectLocations) {
          preview.effectLocations = preview.effectLocations.map(loc => ({
            x: width - 1 - loc.x,
            y: height - 1 - loc.y
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

      // Get game state to check player position
      const gameState = await this.gameService.getGameState(gameId);
      const player = gameState.players[userId];

      // CRITICAL: Transform coordinates if player is away
      // Frontend sends display coordinates, we need absolute coordinates
      if (player && player.position === 'away') {
        const width = gameState.board[0].length;  // Usually 10
        const height = gameState.board.length;     // Usually 3
        
        // Flip coordinates 180 degrees
        x = width - 1 - x;
        y = height - 1 - y;
        
        console.log(`🔄 Transformed away player coords: display → absolute`);
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
   * Handle leaving game
   */
  async handleLeaveGame(socket, data) {
    try {
      const gameId = socket.gameId;
      const userId = socket.userId;

      if (!gameId) return;

      console.log(`👋 User ${userId} is leaving game ${gameId}`);

      // Get game state
      const gameState = await this.gameService.getGameState(gameId);

      if (gameState && gameState.phase !== 'ended') {
        // End the game - player who left forfeits
        const player = gameState.players[userId];
        const opponentId = Object.keys(gameState.players).find(id => id !== userId);
        const opponent = gameState.players[opponentId];

        if (player && opponent) {
          // Calculate final scores
          this.gameService._calculateScores(gameState);

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

          console.log(`🏆 Game ${gameId} ended - ${opponent.username} wins by forfeit`);
        }

        // Clean up the game
        await this.cleanupGame(gameId);
      }

      // Leave socket room
      socket.leave(gameId);
      socket.gameId = null;

      // Delete user game mapping
      await GameStateHelper.deleteUserGame(userId);

      console.log(`✅ User ${userId} successfully left game ${gameId}`);
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

      console.log(`🔌 Game socket disconnected: ${socket.id} (User: ${userId})`);

      // Remove from user sockets map
      if (userId) {
        this.userSockets.delete(userId);
      }

      // Handle game disconnect - treat same as leaving
      if (gameId && userId) {
        const gameState = await this.gameService.getGameState(gameId);

        if (gameState && gameState.phase !== 'ended') {
          console.log(`⚠️ Player ${userId} disconnected from active game ${gameId}`);

          // End the game - disconnected player forfeits
          const player = gameState.players[userId];
          const opponentId = Object.keys(gameState.players).find(id => id !== userId);
          const opponent = gameState.players[opponentId];

          if (player && opponent) {
            // Calculate final scores
            this.gameService._calculateScores(gameState);

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

            console.log(`🏆 Game ${gameId} ended - ${opponent.username} wins by disconnect`);

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
          
          console.log(`📤 Sent game state to ${gameState.players[playerId].username} (viewing as LEFT player)`);
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
      rowScores: myPlayer.rowScores,
      diceRoll: myPlayer.diceRoll,
      hasRolled: myPlayer.hasRolled
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
      rowScores: opponentPlayer.rowScores,
      diceRoll: opponentPlayer.diceRoll,
      hasRolled: opponentPlayer.hasRolled
    };

    // BOARD TRANSFORMATION
    // If viewing player is the "away" player in absolute storage,
    // we need to flip the board 180 degrees
    const isAwayPlayer = myPlayer.position === 'away';
    
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

        flipped[newY][newX] = {
          x: newX,
          y: newY,
          card: originalSquare.card,
          owner: ownerLabel,
          pawns: this._transformPawnLabels(originalSquare.pawns, myPlayerId, opponentId),
          special: originalSquare.special
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
      row.map(square => ({
        ...square,
        owner: square.owner === myPlayerId ? 'me' : 
               square.owner === opponentId ? 'opponent' : null,
        pawns: this._transformPawnLabels(square.pawns, myPlayerId, opponentId)
      }))
    );
  }

  /**
   * Transform pawn owner IDs to labels (me/opponent)
   * @private
   */
  _transformPawnLabels(pawns, myPlayerId, opponentId) {
    const transformed = {};
    
    Object.keys(pawns).forEach(playerId => {
      if (playerId === myPlayerId) {
        transformed.me = pawns[playerId];
      } else if (playerId === opponentId) {
        transformed.opponent = pawns[playerId];
      }
    });

    return transformed;
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

      console.log(`🧹 Cleaned up game ${gameId}`);
    } catch (error) {
      console.error('Error cleaning up game:', error);
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