/**
 * Game DTOs
 * Data Transfer Objects for game-related responses
 */

/**
 * Game Response DTO
 * For completed game records
 */
class GameResponseDto {
  constructor(game) {
    this.id = game._id;
    this.lobbyId = game.lobbyId;
    this.status = game.status;
    this.isDraw = game.isDraw;
    
    this.players = game.players.map(player => ({
      userId: player.userId._id || player.userId,
      username: player.userId.username,
      displayName: player.userId.displayName,
      profilePic: player.userId.profilePic,
      deckId: player.deckId,
      characterId: player.characterId,
      finalScore: player.finalScore,
      cardsPlayed: player.cardsPlayed
    }));

    this.map = {
      id: game.mapId._id || game.mapId,
      name: game.mapId.name,
      image: game.mapId.image
    };

    this.winner = game.winner ? {
      userId: game.winner._id || game.winner,
      username: game.winner.username,
      displayName: game.winner.displayName
    } : null;

    this.totalTurns = game.totalTurns;
    this.gameDuration = game.gameDuration;
    this.createdAt = game.createdAt;
    this.startedAt = game.startedAt;
    this.completedAt = game.completedAt;
  }
}

/**
 * Game List Item DTO
 * Simplified for lists
 */
class GameListItemDto {
  constructor(game) {
    this.id = game._id;
    this.status = game.status;
    
    this.players = game.players.map(player => ({
      userId: player.userId._id || player.userId,
      username: player.userId.username,
      displayName: player.userId.displayName,
      profilePic: player.userId.profilePic,
      finalScore: player.finalScore
    }));

    this.winner = game.winner ? {
      userId: game.winner._id || game.winner,
      displayName: game.winner.displayName
    } : null;

    this.map = {
      id: game.mapId._id || game.mapId,
      name: game.mapId.name
    };

    this.completedAt = game.completedAt;
    this.gameDuration = game.gameDuration;
  }
}

/**
 * Game Stats DTO
 */
class GameStatsDto {
  constructor(stats) {
    this.totalGames = stats.totalGames || 0;
    this.wins = stats.wins || 0;
    this.losses = stats.losses || 0;
    this.winRate = parseFloat(stats.winRate) || 0;
    this.averageScore = parseFloat(stats.averageScore) || 0;
  }
}

/**
 * Leaderboard Entry DTO
 */
class LeaderboardEntryDto {
  constructor(entry, rank) {
    this.rank = rank;
    this.userId = entry.userId;
    this.username = entry.username;
    this.displayName = entry.displayName;
    this.profilePic = entry.profilePic;
    this.totalGames = entry.totalGames;
    this.wins = entry.wins;
    this.winRate = parseFloat(entry.winRate).toFixed(2);
    this.averageScore = parseFloat(entry.averageScore).toFixed(2);
  }
}

/**
 * Active Game State DTO
 * For games currently in progress (from Redis)
 */
class ActiveGameStateDto {
  constructor(gameState) {
    this.gameId = gameState.gameId;
    this.status = gameState.status;
    this.phase = gameState.phase;
    this.currentTurn = gameState.currentTurn;
    this.turnNumber = gameState.turnNumber;
    
    // Player data (me)
    this.me = {
      userId: gameState.me.userId,
      username: gameState.me.username,
      displayName: gameState.me.displayName,
      profilePic: gameState.me.profilePic,
      position: gameState.me.position,
      character: gameState.me.character,
      hand: gameState.me.hand,
      deckCount: gameState.me.deck?.length || 0,
      totalScore: gameState.me.totalScore,
      rowScores: gameState.me.rowScores,
      diceRoll: gameState.me.diceRoll
    };

    // Opponent data (limited info)
    this.opponent = {
      userId: gameState.opponent.userId,
      username: gameState.opponent.username,
      displayName: gameState.opponent.displayName,
      profilePic: gameState.opponent.profilePic,
      position: gameState.opponent.position,
      character: gameState.opponent.character,
      handCount: gameState.opponent.handCount,
      deckCount: gameState.opponent.deckCount,
      totalScore: gameState.opponent.totalScore,
      rowScores: gameState.opponent.rowScores,
      diceRoll: gameState.opponent.diceRoll
    };

    // Board state
    this.board = gameState.board;

    // Settings
    this.settings = gameState.settings;
  }
}

/**
 * Head-to-Head DTO
 */
class HeadToHeadDto {
  constructor(data) {
    this.record = {
      totalGames: data.record.totalGames,
      myWins: data.record.user1Wins,
      opponentWins: data.record.user2Wins,
      draws: data.record.draws
    };

    this.recentGames = data.games.map(game => new GameListItemDto(game));
  }
}

module.exports = {
  GameResponseDto,
  GameListItemDto,
  GameStatsDto,
  LeaderboardEntryDto,
  ActiveGameStateDto,
  HeadToHeadDto
};