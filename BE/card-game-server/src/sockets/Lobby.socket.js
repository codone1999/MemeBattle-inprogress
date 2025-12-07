const LobbyService = require('../services/Lobby.service');
const { LobbyResponseDto } = require('../dto/Lobby.dto');
const LobbyRepository = require('../repositories/Lobby.repository');
const GameService = require('../services/Game.service');

/**
 * Socket.IO Lobby Handler
 * Manages real-time lobby interactions
 */
class SocketLobbyHandler {
  constructor(io) {
    this.io = io;
    this.lobbyService = new LobbyService();
    this.gameService = new GameService();
    this.lobbyRepository = new LobbyRepository();
    
    // Map to store userId -> socketId for quick lookup
    this.userSocketMap = new Map();
    
    // Map to store socketId -> userId
    this.socketUserMap = new Map();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Initialize socket connection with userId from auth
   */
  handleConnection(socket) {
    const userId = socket.handshake.auth?.userId;

    if (userId) {
      socket.userId = userId;
      // Store user-socket mapping immediately
      this.userSocketMap.set(userId.toString(), socket.id);
      this.socketUserMap.set(socket.id, userId.toString());
    }

    // Register all lobby event handlers
    this.registerLobbyHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  /**
   * Register all lobby-related socket event handlers
   */
  registerLobbyHandlers(socket) {
    // Lobby events
    socket.on('lobby:leave', (data) => this.handleLobbyLeave(socket, data));
    socket.on('lobby:update:settings', (data) => this.handleUpdateSettings(socket, data));
    socket.on('lobby:select:deck', (data) => this.handleSelectDeck(socket, data));
    socket.on('lobby:select:character', (data) => this.handleSelectCharacter(socket, data));
    socket.on('lobby:kick:player', (data) => this.handleKickPlayer(socket, data));
    socket.on('lobby:start:game', (data) => this.handleStartGame(socket, data));
    socket.on('lobby:ready:toggle', (data) => this.handleToggleReady(socket, data));
    
    // Listen for when user joins lobby (from REST endpoint)
    socket.on('lobby:joined', (data) => this.handleUserJoinedLobby(socket, data));
  }

  /**
   * Auto-join user's current active lobby on connection
   */
  async autoJoinCurrentLobby(socket) {
    try {
      const userId = socket.userId;
      const lobby = await this.lobbyRepository.findActiveByUserId(userId);

      if (lobby) {
        const lobbyId = lobby._id.toString();
        socket.join(lobbyId);
        socket.lobbyId = lobbyId;
        
        console.log(`User ${userId} auto-joined lobby ${lobbyId}`);
        
        // Broadcast updated lobby state
        await this.broadcastLobbyUpdate(lobbyId);
        
        // Notify user they've reconnected
        socket.emit('lobby:reconnected', {
          lobbyId,
          message: 'Reconnected to lobby'
        });
      }
    } catch (error) {
      console.error('Auto-join lobby error:', error);
    }
  }

  /**
   * Handle user manually joining lobby (called from frontend)
   * Verifies the user is actually in the lobby before joining socket room
   */
  async handleUserJoinedLobby(socket, data) {
    try {
      const { lobbyId, userId } = data;

      if (!lobbyId || !userId) {
        socket.emit('error', { message: 'Lobby ID and User ID required' });
        return;
      }

      // Verify the user is actually in this lobby
      const lobby = await this.lobbyRepository.findById(lobbyId);

      if (!lobby) {
        socket.emit('error', { message: 'Lobby not found' });
        return;
      }

      // Check if user is the host or in the lobby's player list
      const hostId = typeof lobby.hostUserId === 'object'
        ? lobby.hostUserId._id?.toString() || lobby.hostUserId.toString()
        : lobby.hostUserId.toString();

      const isHost = hostId === userId.toString();

      const isPlayerInLobby = lobby.players.some(player => {
        const playerUserId = typeof player.userId === 'object'
          ? player.userId._id?.toString() || player.userId.toString()
          : player.userId.toString();
        return playerUserId === userId.toString();
      });

      if (!isHost && !isPlayerInLobby) {
        socket.emit('error', { message: 'You are not a member of this lobby' });
        return;
      }

      // Store userId and lobbyId on socket for future events
      socket.userId = userId;
      socket.lobbyId = lobbyId;

      // Store user-socket mapping
      this.userSocketMap.set(userId.toString(), socket.id);
      this.socketUserMap.set(socket.id, userId.toString());

      // Join socket.io room
      socket.join(lobbyId);

      // Broadcast updated lobby state to all users in lobby
      await this.broadcastLobbyUpdate(lobbyId);

    } catch (error) {
      console.error('Handle lobby join error:', error);
      socket.emit('error', { message: 'Failed to join lobby room' });
    }
  }

  /**
   * Handle user leaving lobby
   */
  async handleLobbyLeave(socket, data) {
    try {
      const userId = socket.userId;
      const lobbyId = socket.lobbyId || data?.lobbyId;

      if (!lobbyId) {
        socket.emit('error', { message: 'Not in any lobby' });
        return;
      }

      // Leave lobby via service
      const updatedLobby = await this.lobbyService.leaveLobby(lobbyId, userId);

      // Leave socket.io room
      socket.leave(lobbyId);
      socket.lobbyId = null;

      if (updatedLobby) {
        // Broadcast update to remaining players
        await this.broadcastLobbyUpdate(lobbyId);
      } else {
        // Lobby was deleted, notify all users
        this.io.to(lobbyId).emit('lobby:closed', {
          message: 'Lobby has been closed'
        });
      }

      // Confirm to leaving user
      socket.emit('lobby:left', {
        message: 'Successfully left lobby'
      });

    } catch (error) {
      console.error('Leave lobby error:', error);
      socket.emit('error', { message: error.message || 'Failed to leave lobby' });
    }
  }

  /**
   * Handle updating lobby settings (host only)
   */
  async handleUpdateSettings(socket, data) {
    try {
      const userId = socket.userId;
      const lobbyId = socket.lobbyId;

      if (!lobbyId) {
        socket.emit('error', { message: 'Not in any lobby' });
        return;
      }

      const { lobbyName, mapId, gameSettings } = data;

      // Update via service
      await this.lobbyService.updateLobbySettings(lobbyId, userId, {
        lobbyName,
        mapId,
        gameSettings
      });

      // Broadcast update to all users in lobby
      await this.broadcastLobbyUpdate(lobbyId);

    } catch (error) {
      console.error('Update settings error:', error);
      socket.emit('error', { message: error.message || 'Failed to update settings' });
    }
  }

  /**
   * Handle deck selection
   */
  async handleSelectDeck(socket, data) {
    try {
      const userId = socket.userId;
      const lobbyId = socket.lobbyId;

      if (!lobbyId) {
        socket.emit('error', { message: 'Not in any lobby' });
        return;
      }

      const { deckId } = data;

      if (!deckId) {
        socket.emit('error', { message: 'Deck ID required' });
        return;
      }

      // Select deck via service
      await this.lobbyService.selectDeck(lobbyId, userId, deckId);

      // Broadcast update to all users in lobby
      await this.broadcastLobbyUpdate(lobbyId);

    } catch (error) {
      console.error('Select deck error:', error);
      socket.emit('error', { message: error.message || 'Failed to select deck' });
    }
  }

  /**
   * Handle character selection
   */
  async handleSelectCharacter(socket, data) {
    try {
      const userId = socket.userId;
      const lobbyId = socket.lobbyId;

      if (!lobbyId) {
        socket.emit('error', { message: 'Not in any lobby' });
        return;
      }

      const { characterId } = data;

      if (!characterId) {
        socket.emit('error', { message: 'Character ID required' });
        return;
      }

      // Select character via service
      await this.lobbyService.selectCharacter(lobbyId, userId, characterId);

      // Broadcast update to all users in lobby
      await this.broadcastLobbyUpdate(lobbyId);

    } catch (error) {
      console.error('Select character error:', error);
      socket.emit('error', { message: error.message || 'Failed to select character' });
    }
  }

  /**
   * Handle kicking a player (host only)
   */
  async handleKickPlayer(socket, data) {
    try {
      const userId = socket.userId;
      const lobbyId = socket.lobbyId;

      if (!lobbyId) {
        socket.emit('error', { message: 'Not in any lobby' });
        return;
      }

      const { playerId } = data;

      if (!playerId) {
        socket.emit('error', { message: 'Player ID required' });
        return;
      }

      // Kick player via service
      await this.lobbyService.kickPlayer(lobbyId, userId, playerId);

      // Notify kicked player
      const kickedPlayerSocketId = this.userSocketMap.get(playerId.toString());
      if (kickedPlayerSocketId) {
        const kickedSocket = this.io.sockets.sockets.get(kickedPlayerSocketId);
        if (kickedSocket) {
          kickedSocket.leave(lobbyId);
          kickedSocket.lobbyId = null;
          kickedSocket.emit('lobby:kicked', {
            message: 'You have been kicked from the lobby'
          });
        }
      }

      // Broadcast update to remaining users
      await this.broadcastLobbyUpdate(lobbyId);

    } catch (error) {
      console.error('Kick player error:', error);
      socket.emit('error', { message: error.message || 'Failed to kick player' });
    }
  }

  /**
   * Handle starting the game (host only)
   */
  async handleStartGame(socket, data) {
    const userId = socket.userId;
    const lobbyId = socket.lobbyId;

    try {
      if (!lobbyId) {
        socket.emit('error', { message: 'Not in any lobby' });
        return;
      }

      // Start game via service (changes status to 'started')
      const result = await this.lobbyService.startGame(lobbyId, userId);

      // Use createGame and pass the lobby ID string
      const gameState = await this.gameService.createGame(result.lobby._id.toString());

      // Update lobby with gameId (using lobbyId as gameId for consistency)
      await this.lobbyRepository.updateById(lobbyId, { gameId: lobbyId });

      // Broadcast "Game Started" to all players
      // gameId is the same as lobbyId for simplicity
      this.io.to(lobbyId).emit('game:started', {
        lobbyId: lobbyId,
        gameId: gameState.gameId,
        message: 'Game initialized, switching to game view...'
      });

    } catch (error) {
      console.error('Start game error:', error);

      // Revert lobby status back to 'ready' if game creation failed
      try {
        if (lobbyId) {
          await this.lobbyRepository.updateStatus(lobbyId, 'ready');
          console.log(`Reverted lobby ${lobbyId} status to 'ready' after failed game start`);
        }
      } catch (revertError) {
        console.error('Failed to revert lobby status:', revertError);
      }

      socket.emit('error', { message: error.message || 'Failed to start game' });
    }
  }

  /**
   * Handle toggling ready status
   */
  async handleToggleReady(socket, data) {
    try {
      const userId = socket.userId;
      const lobbyId = socket.lobbyId;

      if (!lobbyId) {
        socket.emit('error', { message: 'Not in any lobby' });
        return;
      }

      const { isReady } = data;

      // Update ready status
      await this.lobbyRepository.updatePlayerReady(lobbyId, userId, isReady);

      // Broadcast update
      await this.broadcastLobbyUpdate(lobbyId);

    } catch (error) {
      console.error('Toggle ready error:', error);
      socket.emit('error', { message: error.message || 'Failed to update ready status' });
    }
  }

  /**
   * Handle socket disconnection
   */
  async handleDisconnect(socket) {
    try {
      const userId = socket.userId;
      const lobbyId = socket.lobbyId;

      // Clean up mappings
      if (userId) {
        this.userSocketMap.delete(userId.toString());
      }
      this.socketUserMap.delete(socket.id);

      // Give user 2 minutes to reconnect before removing from lobby
      if (lobbyId) {
        setTimeout(async () => {
          // Check if user reconnected
          const currentSocketId = this.userSocketMap.get(userId?.toString());

          if (!currentSocketId) {
            try {
              const lobby = await this.lobbyRepository.findById(lobbyId);

              if (lobby && lobby.status !== 'started') {
                // Only auto-remove if game hasn't started
                await this.lobbyService.leaveLobby(lobbyId, userId);
                await this.broadcastLobbyUpdate(lobbyId);
              }
            } catch (error) {
              console.error('Auto-remove user error:', error);
            }
          }
        }, 2 * 60 * 1000); // 2 minutes
      }

    } catch (error) {
      console.error('Disconnect handler error:', error);
    }
  }

  /**
   * Broadcast lobby state update to all users in lobby
   */
  async broadcastLobbyUpdate(lobbyId) {
    try {
      const lobby = await this.lobbyRepository.findByIdPopulated(lobbyId);

      if (!lobby) {
        return;
      }

      const lobbyDto = new LobbyResponseDto(lobby);
      this.io.to(lobbyId).emit('lobby:state:update', lobbyDto);
    } catch (error) {
      console.error('Broadcast lobby update error:', error);
    }
  }

  /**
   * Broadcast new lobby created (for lobby list updates)
   */
  broadcastNewLobby(lobby) {
    this.io.emit('lobby:created', new LobbyResponseDto(lobby));
  }

  /**
   * Broadcast lobby deleted (for lobby list updates)
   */
  broadcastLobbyDeleted(lobbyId) {
    this.io.emit('lobby:deleted', { lobbyId });
  }

  /**
   * Get socket by user ID
   */
  getSocketByUserId(userId) {
    const socketId = this.userSocketMap.get(userId.toString());
    if (socketId) {
      return this.io.sockets.sockets.get(socketId);
    }
    return null;
  }

  /**
   * Force disconnect a user
   */
  forceDisconnectUser(userId) {
    const socket = this.getSocketByUserId(userId);
    if (socket) {
      socket.disconnect(true);
    }
  }
}

module.exports = SocketLobbyHandler;