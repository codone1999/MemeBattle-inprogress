/**
 * Lobby Data Transfer Objects
 * Used for API requests and responses
 */

class CreateLobbyDto {
  constructor(data) {
    this.lobbyName = data.lobbyName;
    this.mapId = data.mapId;
    this.isPrivate = data.isPrivate || false;
    this.password = data.password || null;
    this.gameSettings = data.gameSettings || {};
  }
}

class JoinLobbyDto {
  constructor(data) {
    this.password = data.password || null;
  }
}

class UpdateLobbySettingsDto {
  constructor(data) {
    this.lobbyName = data.lobbyName;
    this.mapId = data.mapId;
    this.gameSettings = data.gameSettings;
  }
}

class SelectDeckDto {
  constructor(data) {
    this.deckId = data.deckId;
  }
}

class SelectCharacterDto {
  constructor(data) {
    this.characterId = data.characterId;
  }
}

class LobbyPlayerDto {
  constructor(player, user) {
    this._id = player.userId;
    this.username = user.username;
    this.displayName = user.displayName;
    this.profilePic = user.profilePic;
    this.deckId = player.deckId;
    this.characterId = player.characterId;
    this.isReady = player.isReady;
    this.joinedAt = player.joinedAt;
  }
}

class LobbyResponseDto {
  constructor(lobby, populatedData = {}) {
    this._id = lobby._id;
    this.lobbyName = lobby.lobbyName;
    this.status = lobby.status;
    this.isPrivate = lobby.isPrivate;
    this.maxPlayers = lobby.maxPlayers;
    this.playerCount = lobby.players.length;
    this.isFull = lobby.players.length >= lobby.maxPlayers;
    
    // Host info
    if (populatedData.host || lobby.hostUserId) {
      const hostData = populatedData.host || lobby.hostUserId;
      this.host = {
        _id: hostData._id,
        username: hostData.username,
        displayName: hostData.displayName,
        profilePic: hostData.profilePic
      };
    }

    // Players info
    this.players = lobby.players.map((player, index) => {
      const userData = populatedData.players?.[index] || player.userId;
      return {
        _id: player.userId,
        username: userData.username,
        displayName: userData.displayName,
        profilePic: userData.profilePic,
        deckId: player.deckId,
        characterId: player.characterId,
        isReady: player.isReady,
        joinedAt: player.joinedAt
      };
    });

    // Map info
    if (populatedData.map || lobby.mapId) {
      const mapData = populatedData.map || lobby.mapId;
      this.map = {
        _id: mapData._id,
        name: mapData.name,
        image: mapData.image,
        gridSize: mapData.gridSize,
        difficulty: mapData.difficulty
      };
    }

    // Game settings
    this.gameSettings = lobby.gameSettings;

    // Timestamps
    this.createdAt = lobby.createdAt;
    this.startedAt = lobby.startedAt;
    this.expiresAt = lobby.expiresAt;
  }
}

class LobbyListItemDto {
  constructor(lobby) {
    this._id = lobby._id;
    this.lobbyName = lobby.lobbyName;
    this.hostUsername = lobby.hostUserId?.username || 'Unknown';
    this.playerCount = lobby.players.length;
    this.maxPlayers = lobby.maxPlayers;
    this.isFull = lobby.players.length >= lobby.maxPlayers;
    this.isPrivate = lobby.isPrivate;
    this.status = lobby.status;
    this.mapName = lobby.mapId?.name || 'Unknown Map';
    this.createdAt = lobby.createdAt;
  }
}

module.exports = {
  CreateLobbyDto,
  JoinLobbyDto,
  UpdateLobbySettingsDto,
  SelectDeckDto,
  SelectCharacterDto,
  LobbyPlayerDto,
  LobbyResponseDto,
  LobbyListItemDto
};