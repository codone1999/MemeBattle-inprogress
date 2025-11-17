/**
 * Lobby List Broadcaster
 * Broadcasts lobby list updates to all clients viewing the lobby list
 */
class LobbyListBroadcaster {
  constructor(io) {
    this.io = io;
  }

  /**
   * Broadcast new lobby created
   * @param {Object} lobby - Created lobby
   */
  broadcastLobbyCreated(lobby) {
    // Only broadcast if it's a public lobby
    if (!lobby.isPrivate) {
      this.io.emit('lobbyList:lobby:created', {
        _id: lobby._id,
        lobbyName: lobby.lobbyName,
        hostUsername: lobby.hostUserId?.username,
        playerCount: lobby.players.length,
        maxPlayers: lobby.maxPlayers,
        isFull: lobby.players.length >= lobby.maxPlayers,
        isPrivate: lobby.isPrivate,
        status: lobby.status,
        mapName: lobby.mapId?.name,
        createdAt: lobby.createdAt
      });
    }
  }

  /**
   * Broadcast lobby updated (player count changed, etc)
   * @param {Object} lobby - Updated lobby
   */
  broadcastLobbyUpdated(lobby) {
    // Only broadcast if it's a public lobby
    if (!lobby.isPrivate) {
      this.io.emit('lobbyList:lobby:updated', {
        _id: lobby._id,
        playerCount: lobby.players.length,
        isFull: lobby.players.length >= lobby.maxPlayers,
        status: lobby.status
      });
    }
  }

  /**
   * Broadcast lobby deleted/closed
   * @param {string} lobbyId - Lobby ID
   */
  broadcastLobbyDeleted(lobbyId) {
    this.io.emit('lobbyList:lobby:deleted', {
      lobbyId
    });
  }

  /**
   * Broadcast lobby started (remove from list)
   * @param {string} lobbyId - Lobby ID
   */
  broadcastLobbyStarted(lobbyId) {
    this.io.emit('lobbyList:lobby:started', {
      lobbyId
    });
  }
}

module.exports = LobbyListBroadcaster;