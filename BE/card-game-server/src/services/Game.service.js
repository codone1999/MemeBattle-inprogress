const GameRepository = require('../repositories/Game.repository');
const LobbyRepository = require('../repositories/Lobby.repository');
const DeckRepository = require('../repositories/Deck.repository');
const CardRepository = require('../repositories/Card.repository');
const CharacterRepository = require('../repositories/Character.repository');
const UserRepository = require('../repositories/user.repository');
const redis = require('../config/redis');

/**
 * Game Service
 * Handles all game logic for Queen's Blood style gameplay
 */
class GameService {
  constructor() {
    this.gameRepository = new GameRepository();
    this.lobbyRepository = new LobbyRepository();
    this.deckRepository = new DeckRepository();
    this.cardRepository = new CardRepository();
    this.characterRepository = new CharacterRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Create a new game from lobby
   * @param {string} lobbyId - Lobby ID
   * @returns {Promise<Object>} - Initial game state
   */
  async createGame(lobbyId) {
    // Get lobby with all populated data
    const lobby = await this.lobbyRepository.findByIdPopulated(lobbyId);
    
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (lobby.players.length !== 2) {
      throw new Error('Game requires exactly 2 players');
    }

    if (!lobby.allPlayersReady()) {
      throw new Error('All players must be ready');
    }

    // Get players data
    const [playerA, playerB] = lobby.players;
    
    // Validate players have selected deck and character
    if (!playerA.deckId || !playerA.characterId) {
      throw new Error('Player 1 must select a deck and character');
    }
    if (!playerB.deckId || !playerB.characterId) {
      throw new Error('Player 2 must select a deck and character');
    }
    
    // Load decks with cards
    const [deckA, deckB] = await Promise.all([
      this.deckRepository.findByIdPopulated(playerA.deckId._id || playerA.deckId),
      this.deckRepository.findByIdPopulated(playerB.deckId._id || playerB.deckId)
    ]);

    // Load characters (from lobby players, not from deck)
    const [characterA, characterB] = await Promise.all([
      this.characterRepository.findById(playerA.characterId._id || playerA.characterId),
      this.characterRepository.findById(playerB.characterId._id || playerB.characterId)
    ]);

    // Shuffle decks
    const shuffledDeckA = this._shuffleDeck(deckA.cards);
    const shuffledDeckB = this._shuffleDeck(deckB.cards);

    // Draw initial hands (5 cards each)
    const handA = shuffledDeckA.splice(0, 5);
    const handB = shuffledDeckB.splice(0, 5);

    // Initialize board based on map with starting pawns
    const board = this._initializeBoard(
      lobby.mapId,
      playerA.userId._id.toString(),
      playerB.userId._id.toString()
    );

    // Create initial game state
    const gameState = {
      gameId: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lobbyId: lobbyId.toString(),
      mapId: lobby.mapId._id.toString(),
      status: 'dice_roll',
      phase: 'dice_roll',
      currentTurn: null,
      turnNumber: 0,
      createdAt: new Date().toISOString(),
      
      // Players data (absolute - Player A is always "home")
      players: {
        [playerA.userId._id.toString()]: {
          userId: playerA.userId._id.toString(),
          username: playerA.userId.username,
          displayName: playerA.userId.displayName,
          profilePic: playerA.userId.profilePic,
          position: 'home', // Always bottom/left in their view
          deckId: deckA._id.toString(),
          characterId: (playerA.characterId._id || playerA.characterId).toString(),
          character: {
            name: characterA.name,
            characterPic: characterA.characterPic,
            rarity: characterA.rarity,
            abilities: characterA.abilities
          },
          hand: handA.map(card => ({
            cardId: card.cardId._id.toString(),
            ...card.cardId._doc
          })),
          deck: shuffledDeckA.map(card => card.cardId._id.toString()),
          diceRoll: null,
          hasRolled: false,
          totalScore: 0,
          rowScores: [0, 0, 0], // Scores for rows 0, 1, 2
          coinsEarned: 0
        },
        [playerB.userId._id.toString()]: {
          userId: playerB.userId._id.toString(),
          username: playerB.userId.username,
          displayName: playerB.userId.displayName,
          profilePic: playerB.userId.profilePic,
          position: 'away', // Always top/right in their view
          deckId: deckB._id.toString(),
          characterId: (playerB.characterId._id || playerB.characterId).toString(),
          character: {
            name: characterB.name,
            characterPic: characterB.characterPic,
            rarity: characterB.rarity,
            abilities: characterB.abilities
          },
          hand: handB.map(card => ({
            cardId: card.cardId._id.toString(),
            ...card.cardId._doc
          })),
          deck: shuffledDeckB.map(card => card.cardId._id.toString()),
          diceRoll: null,
          hasRolled: false,
          totalScore: 0,
          rowScores: [0, 0, 0],
          coinsEarned: 0
        }
      },

      // Board state (3 rows x 10 columns based on map)
      board: board,

      // Game settings
      settings: {
        turnTimeLimit: lobby.gameSettings.turnTimeLimit || 60,
        allowSpectators: lobby.gameSettings.allowSpectators || false
      }
    };

    // Store in Redis with 2 hour expiration
    await redis.setex(
      `game:${gameState.gameId}`,
      7200, // 2 hours
      JSON.stringify(gameState)
    );

    // Update lobby status
    await this.lobbyRepository.updateById(lobbyId, {
      status: 'started',
      gameId: gameState.gameId,
      startedAt: new Date()
    });

    return gameState;
  }

  /**
   * Get game state from Redis
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} - Game state
   */
  async getGameState(gameId) {
    const gameData = await redis.get(`game:${gameId}`);
    
    if (!gameData) {
      throw new Error('Game not found');
    }

    return JSON.parse(gameData);
  }

  /**
   * Update game state in Redis
   * @param {string} gameId - Game ID
   * @param {Object} gameState - Updated game state
   */
  async updateGameState(gameId, gameState) {
    await redis.setex(
      `game:${gameId}`,
      7200,
      JSON.stringify(gameState)
    );
  }

  /**
   * Handle dice roll
   * @param {string} gameId - Game ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Dice roll result
   */
  async rollDice(gameId, userId) {
    const gameState = await this.getGameState(gameId);

    if (gameState.phase !== 'dice_roll') {
      throw new Error('Not in dice roll phase');
    }

    const player = gameState.players[userId];
    if (!player) {
      throw new Error('Player not in this game');
    }

    if (player.hasRolled) {
      throw new Error('You have already rolled');
    }

    // Roll dice (1-6)
    const roll = Math.floor(Math.random() * 6) + 1;
    player.diceRoll = roll;
    player.hasRolled = true;

    await this.updateGameState(gameId, gameState);

    // Check if both players have rolled
    const allRolled = Object.values(gameState.players).every(p => p.hasRolled);

    if (allRolled) {
      return await this._resolveDiceRoll(gameId, gameState);
    }

    return {
      type: 'wait',
      myRoll: roll,
      message: 'Waiting for opponent...'
    };
  }

  /**
   * Resolve dice roll and determine first turn
   * @private
   */
  async _resolveDiceRoll(gameId, gameState) {
    const players = Object.values(gameState.players);
    const [playerA, playerB] = players;

    if (playerA.diceRoll === playerB.diceRoll) {
      // Tie - reset and roll again
      playerA.hasRolled = false;
      playerB.hasRolled = false;
      playerA.diceRoll = null;
      playerB.diceRoll = null;

      await this.updateGameState(gameId, gameState);

      return {
        type: 'tie',
        playerA_roll: playerA.diceRoll,
        playerB_roll: playerB.diceRoll,
        message: 'Tie! Roll again.'
      };
    }

    // Determine winner
    const firstPlayer = playerA.diceRoll > playerB.diceRoll ? playerA : playerB;
    
    gameState.currentTurn = firstPlayer.userId;
    gameState.phase = 'playing';
    gameState.turnNumber = 1;
    gameState.status = 'playing';

    await this.updateGameState(gameId, gameState);

    return {
      type: 'result',
      playerA_roll: playerA.diceRoll,
      playerB_roll: playerB.diceRoll,
      firstTurn: firstPlayer.userId,
      message: `${firstPlayer.displayName} goes first!`
    };
  }

  /**
   * Preview card placement (for hover effect)
   * @param {string} gameId - Game ID
   * @param {string} userId - User ID
   * @param {string} cardId - Card ID
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Promise<Object>} - Preview data
   */
  async previewCardPlacement(gameId, userId, cardId, x, y) {
    const gameState = await this.getGameState(gameId);
    const player = gameState.players[userId];
    
    if (!player) {
      throw new Error('Player not in this game');
    }

    // Find card in hand
    const card = player.hand.find(c => c.cardId === cardId);
    if (!card) {
      return { isValid: false, message: 'Card not in hand' };
    }

    // Check if placement is valid
    const square = gameState.board[y][x];
    
    // Check pawn requirement
    const playerPawns = square.pawns[userId] || 0;
    if (playerPawns < card.pawnRequirement) {
      return {
        isValid: false,
        message: `Need ${card.pawnRequirement} pawns (you have ${playerPawns})`
      };
    }

    // Check if square already has a card from this player
    if (square.card && square.owner === userId) {
      return {
        isValid: false,
        message: 'You already have a card here'
      };
    }

    // Calculate pawn locations
    const pawnLocations = this._calculatePawnLocations(card, x, y, gameState.board);
    
    // Calculate effect locations (for buff/debuff cards)
    const effectLocations = this._calculateEffectLocations(card, x, y);

    return {
      isValid: true,
      pawnLocations,
      effectLocations,
      message: 'Valid placement'
    };
  }

  /**
   * Play a card
   * @param {string} gameId - Game ID
   * @param {string} userId - User ID
   * @param {string} cardId - Card ID
   * @param {number} handCardIndex - Index in hand
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Promise<Object>} - Updated game state
   */
  async playCard(gameId, userId, cardId, handCardIndex, x, y) {
    const gameState = await this.getGameState(gameId);

    // Validate turn
    if (gameState.currentTurn !== userId) {
      throw new Error('Not your turn');
    }

    if (gameState.phase !== 'playing') {
      throw new Error('Not in playing phase');
    }

    const player = gameState.players[userId];
    const opponent = Object.values(gameState.players).find(p => p.userId !== userId);

    // Validate card
    const card = player.hand[handCardIndex];
    if (!card || card.cardId !== cardId) {
      throw new Error('Invalid card');
    }

    // Validate placement
    const square = gameState.board[y][x];
    const playerPawns = square.pawns[userId] || 0;
    
    if (playerPawns < card.pawnRequirement) {
      throw new Error(`Need ${card.pawnRequirement} pawns (you have ${playerPawns})`);
    }

    if (square.card && square.owner === userId) {
      throw new Error('You already have a card here');
    }

    // Place card on board
    square.card = {
      cardId: card.cardId,
      name: card.name,
      power: card.power,
      cardType: card.cardType,
      ability: card.ability
    };
    square.owner = userId;

    // Handle pawn override
    if (square.owner && square.owner !== userId) {
      // Override opponent's pawns
      square.pawns = { [userId]: 1 };
    } else {
      // Reset own pawns or set to 1
      square.pawns = { [userId]: 1 };
    }

    // Add pawns to locations
    if (card.pawnLocations && card.pawnLocations.length > 0) {
      for (const pawnLoc of card.pawnLocations) {
        const targetX = x + pawnLoc.relativeX;
        const targetY = y + pawnLoc.relativeY;

        if (this._isValidCoordinate(targetX, targetY, gameState.board)) {
          const targetSquare = gameState.board[targetY][targetX];
          targetSquare.pawns[userId] = Math.min(
            (targetSquare.pawns[userId] || 0) + 1,
            4 // Max 4 pawns per square
          );
        }
      }
    }

    // Remove card from hand
    player.hand.splice(handCardIndex, 1);

    // Recalculate scores
    this._calculateScores(gameState);

    // Check for game end
    const gameEnded = this._checkGameEnd(gameState);
    
    if (gameEnded) {
      gameState.phase = 'ended';
      gameState.status = 'completed';
      
      // Save to MongoDB
      await this._saveCompletedGame(gameState);
      
      await this.updateGameState(gameId, gameState);
      return gameState;
    }

    // Draw card for opponent's next turn
    if (opponent.deck.length > 0) {
      const drawnCardId = opponent.deck.shift();
      const drawnCard = await this.cardRepository.findById(drawnCardId);
      
      if (drawnCard) {
        opponent.hand.push({
          cardId: drawnCard._id.toString(),
          ...drawnCard._doc
        });
      }
    }

    // Switch turn
    gameState.currentTurn = opponent.userId;
    gameState.turnNumber++;

    await this.updateGameState(gameId, gameState);

    return gameState;
  }

  /**
   * Skip turn
   * @param {string} gameId - Game ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated game state
   */
  async skipTurn(gameId, userId) {
    const gameState = await this.getGameState(gameId);

    if (gameState.currentTurn !== userId) {
      throw new Error('Not your turn');
    }

    if (gameState.phase !== 'playing') {
      throw new Error('Not in playing phase');
    }

    const opponent = Object.values(gameState.players).find(p => p.userId !== userId);

    // Draw card for opponent
    if (opponent.deck.length > 0) {
      const drawnCardId = opponent.deck.shift();
      const drawnCard = await this.cardRepository.findById(drawnCardId);
      
      if (drawnCard) {
        opponent.hand.push({
          cardId: drawnCard._id.toString(),
          ...drawnCard._doc
        });
      }
    }

    // Switch turn
    gameState.currentTurn = opponent.userId;
    gameState.turnNumber++;

    await this.updateGameState(gameId, gameState);

    return gameState;
  }

  /**
   * Transform game state for away player perspective
   * @param {Object} gameState - Original game state
   * @param {string} awayPlayerId - Away player user ID
   * @returns {Object} - Transformed game state
   */
  transformStateForAwayPlayer(gameState, awayPlayerId) {
    const transformed = JSON.parse(JSON.stringify(gameState)); // Deep clone

    // Transform board (flip 180 degrees)
    const originalBoard = gameState.board;
    const height = originalBoard.length;
    const width = originalBoard[0].length;
    
    transformed.board = Array(height).fill(null).map(() => Array(width).fill(null));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const newY = height - 1 - y;
        const newX = width - 1 - x;
        
        const originalSquare = originalBoard[y][x];
        const transformedSquare = {
          ...originalSquare,
          owner: originalSquare.owner === awayPlayerId ? 'me' : 
                 originalSquare.owner ? 'opponent' : null
        };

        transformed.board[newY][newX] = transformedSquare;
      }
    }

    // Transform player data for perspective
    const homePlayer = Object.values(gameState.players).find(p => p.userId !== awayPlayerId);
    const awayPlayer = gameState.players[awayPlayerId];

    transformed.me = {
      ...awayPlayer,
      position: 'home' // Away player sees themselves as home
    };

    transformed.opponent = {
      userId: homePlayer.userId,
      username: homePlayer.username,
      displayName: homePlayer.displayName,
      profilePic: homePlayer.profilePic,
      position: 'away',
      character: homePlayer.character,
      handCount: homePlayer.hand.length, // Don't send actual cards
      deckCount: homePlayer.deck.length,
      totalScore: homePlayer.totalScore,
      rowScores: homePlayer.rowScores
    };

    // Remove full player data
    delete transformed.players;

    return transformed;
  }

  /**
   * Calculate pawn locations based on card
   * @private
   */
  _calculatePawnLocations(card, x, y, board) {
    if (!card.pawnLocations) return [];

    const locations = [];
    const width = board[0].length;
    const height = board.length;

    for (const pawnLoc of card.pawnLocations) {
      const targetX = x + pawnLoc.relativeX;
      const targetY = y + pawnLoc.relativeY;

      if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
        locations.push({ x: targetX, y: targetY });
      }
    }

    return locations;
  }

  /**
   * Calculate effect locations for buff/debuff
   * @private
   */
  _calculateEffectLocations(card, x, y) {
    if (!card.ability || !card.ability.abilityLocations) return [];

    const locations = [];

    for (const effectLoc of card.ability.abilityLocations) {
      locations.push({
        x: x + effectLoc.relativeX,
        y: y + effectLoc.relativeY
      });
    }

    return locations;
  }

  /**
   * Calculate scores for all players
   * @private
   */
  _calculateScores(gameState) {
    const players = Object.keys(gameState.players);
    const board = gameState.board;

    // Reset scores
    players.forEach(playerId => {
      gameState.players[playerId].rowScores = [0, 0, 0];
      gameState.players[playerId].totalScore = 0;
    });

    // Calculate score for each row
    for (let y = 0; y < board.length; y++) {
      const rowScores = {};
      
      players.forEach(playerId => {
        rowScores[playerId] = 0;
      });

      // Sum up card powers in this row
      for (let x = 0; x < board[y].length; x++) {
        const square = board[y][x];
        
        if (square.card && square.owner) {
          let cardScore = square.card.power;

          // Apply buff/debuff effects from cards in this row
          for (let checkX = 0; checkX < board[y].length; checkX++) {
            const checkSquare = board[y][checkX];
            
            if (checkSquare.card && checkSquare.card.ability) {
              const ability = checkSquare.card.ability;
              
              // Check if this square is in ability range
              if (this._isInAbilityRange(x, y, checkX, y, ability.abilityLocations)) {
                if (ability.effectType === 'scoreBoost') {
                  cardScore += ability.effectValue;
                } else if (ability.effectType === 'scoreReduction') {
                  cardScore -= ability.effectValue;
                } else if (ability.effectType === 'multiplier') {
                  cardScore *= ability.effectValue;
                }
              }
            }
          }

          rowScores[square.owner] += cardScore;
        }
      }

      // Determine row winner and add their score
      const scores = Object.entries(rowScores);
      if (scores.length === 2) {
        const [player1, score1] = scores[0];
        const [player2, score2] = scores[1];

        if (score1 > score2) {
          gameState.players[player1].rowScores[y] = score1;
          gameState.players[player1].totalScore += score1;
        } else if (score2 > score1) {
          gameState.players[player2].rowScores[y] = score2;
          gameState.players[player2].totalScore += score2;
        }
        // If tied, neither gets points for that row
      }
    }
  }

  /**
   * Check if coordinates are in ability range
   * @private
   */
  _isInAbilityRange(targetX, targetY, sourceX, sourceY, abilityLocations) {
    if (!abilityLocations) return false;

    for (const loc of abilityLocations) {
      if (targetX === sourceX + loc.relativeX && targetY === sourceY + loc.relativeY) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if game has ended
   * @private
   */
  _checkGameEnd(gameState) {
    const players = Object.values(gameState.players);
    
    // Game ends when both players have no cards in hand and deck
    return players.every(player => 
      player.hand.length === 0 && player.deck.length === 0
    );
  }

  /**
   * Save completed game to MongoDB
   * @private
   */
  async _saveCompletedGame(gameState) {
    const players = Object.values(gameState.players);
    const [playerA, playerB] = players;

    // Determine winner
    let winnerId = null;
    if (playerA.totalScore > playerB.totalScore) {
      winnerId = playerA.userId;
      playerA.coinsEarned = 2;
    } else if (playerB.totalScore > playerA.totalScore) {
      winnerId = playerB.userId;
      playerB.coinsEarned = 2;
    }

    // Create game document
    const gameDoc = {
      lobbyId: gameState.lobbyId,
      players: [
        {
          userId: playerA.userId,
          deckId: playerA.deckId,
          characterId: playerA.characterId,
          finalScore: playerA.totalScore,
          cardsPlayed: 30 - playerA.hand.length // Assuming 30 card deck
        },
        {
          userId: playerB.userId,
          deckId: playerB.deckId,
          characterId: playerB.characterId,
          finalScore: playerB.totalScore,
          cardsPlayed: 30 - playerB.hand.length
        }
      ],
      mapId: gameState.mapId,
      totalTurns: gameState.turnNumber,
      status: 'completed',
      winner: winnerId,
      gameDuration: Math.floor((Date.now() - new Date(gameState.createdAt).getTime()) / 1000),
      createdAt: gameState.createdAt,
      startedAt: gameState.createdAt,
      completedAt: new Date()
    };

    // Save to MongoDB
    await this.gameRepository.create(gameDoc);

    // Update user stats
    for (const player of players) {
      await this.userRepository.updateStats(
        player.userId,
        player.userId === winnerId ? 'win' : 'loss'
      );
    }

    // Delete lobby
    await this.lobbyRepository.deleteById(gameState.lobbyId);
  }

  /**
   * Initialize board based on map
   * @private
   */
  _initializeBoard(map, playerAId, playerBId) {
    const height = map.gridSize?.height || 3;
    const width = map.gridSize?.width || 10;

    const board = Array(height).fill(null).map((_, y) =>
      Array(width).fill(null).map((_, x) => ({
        x,
        y,
        card: null,
        owner: null,
        pawns: {}, // { playerId: pawnCount }
        special: this._getSpecialSquareEffect(map, x, y)
      }))
    );

    // Add initial pawns (players start with 1 pawn in center squares)
    const centerX = Math.floor(width / 2);
    
    // Player A (home) starts with 1 pawn in bottom row (row 2)
    board[2][centerX].pawns[playerAId] = 1;
    
    // Player B (away) starts with 1 pawn in top row (row 0)
    board[0][centerX].pawns[playerBId] = 1;

    return board;
  }

  /**
   * Get special square effect from map
   * @private
   */
  _getSpecialSquareEffect(map, x, y) {
    if (!map.specialSquares) return null;

    const special = map.specialSquares.find(
      s => s.position.x === x && s.position.y === y
    );

    return special ? special : null;
  }

  /**
   * Shuffle deck
   * @private
   */
  _shuffleDeck(cards) {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Check if coordinates are valid
   * @private
   */
  _isValidCoordinate(x, y, board) {
    return y >= 0 && y < board.length && x >= 0 && x < board[0].length;
  }

  /**
   * Delete game from Redis
   * @param {string} gameId - Game ID
   */
  async deleteGame(gameId) {
    await redis.del(`game:${gameId}`);
  }
}

module.exports = GameService;