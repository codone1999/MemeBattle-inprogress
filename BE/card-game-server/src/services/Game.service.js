const GameRepository = require('../repositories/Game.repository');
const LobbyRepository = require('../repositories/Lobby.repository');
const DeckRepository = require('../repositories/Deck.repository');
const CardRepository = require('../repositories/Card.repository');
const CharacterRepository = require('../repositories/Character.repository');
const UserRepository = require('../repositories/user.repository');
const GachaService = require('../services/Gacha.service');
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
    this.gachaService = new GachaService();
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

    if (!lobby.mapId) {
      throw new Error('Lobby has an invalid or missing map. Cannot start game.');
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
    // Pass character data to apply start_game abilities
    const board = this._initializeBoard(
      lobby.mapId,
      playerA.userId._id.toString(),
      playerB.userId._id.toString(),
      characterA,
      characterB
    );

    // Create initial game state
    // Use lobbyId as gameId for consistency and to avoid ObjectId casting errors
    const gameState = {
      gameId: lobbyId.toString(),
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
          diceDetails: null,
          hasRolled: false,
          consecutiveSkips: 0, // Track consecutive skips
          totalScore: 0,
          rowScores: [0, 0, 0], // Scores for rows 0, 1, 2
          coinsEarned: 0,
          abilityUsesRemaining: characterA.abilities?.maxUses || 0, // For active abilities
          activeRowMultipliers: {} // Track active multipliers by row: { rowIndex: multiplier }
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
          diceDetails: null,
          hasRolled: false,
          consecutiveSkips: 0, // Track consecutive skips
          totalScore: 0,
          rowScores: [0, 0, 0],
          coinsEarned: 0,
          abilityUsesRemaining: characterB.abilities?.maxUses || 0, // For active abilities
          activeRowMultipliers: {} // Track active multipliers by row: { rowIndex: multiplier }
        }
      },

      // Board state (3 rows x 6 columns based on map)
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
   * Handle dice roll (2 dice)
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

    // Roll 2 dice (1-6 each)
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = dice1 + dice2;

    player.diceRoll = totalRoll;
    player.diceDetails = { dice1, dice2 }; // Store individual dice
    player.hasRolled = true;

    await this.updateGameState(gameId, gameState);

    // Check if both players have rolled
    const allRolled = Object.values(gameState.players).every(p => p.hasRolled);

    if (allRolled) {
      return await this._resolveDiceRoll(gameId, gameState);
    }

    return {
      type: 'wait',
      myRoll: totalRoll,
      diceDetails: { dice1, dice2 },
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

    // Validate coordinates
    if (x === null || x === undefined || y === null || y === undefined) {
      return { isValid: false, message: 'Invalid coordinates' };
    }

    // Validate board boundaries
    if (y < 0 || y >= gameState.board.length || x < 0 || x >= gameState.board[0].length) {
      return { isValid: false, message: 'Coordinates out of bounds' };
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

    // Calculate pawn locations (where pawns will be added)
    const pawnLocations = this._calculatePawnLocations(card, x, y, gameState.board, player);

    // Calculate ability effect locations (for buff/debuff cards)
    const abilityLocations = this._calculateAbilityLocations(card, x, y, gameState.board, player);

    return {
      isValid: true,
      pawnLocations,
      abilityLocations, // NEW: Send ability locations
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
      ability: card.ability,
      pawnLocations: card.pawnLocations // Store for reference
    };
    square.owner = userId;

    // Calculate and store ability locations on the board square
    if (card.ability && card.ability.abilityLocations) {
      square.abilityLocations = this._calculateAbilityLocations(card, x, y, gameState.board, player);
    }

    // Handle pawn override (with Sephiroth ability check)
    const hasSephirothAbility = this._checkSephirothAbility(player.character);

    if (square.pawns[opponent.userId]) {
      // Check if player has Sephiroth's Octaslash ability
      if (hasSephirothAbility) {
        // Sephiroth ability: accumulate enemy pawns instead of replacing
        const enemyPawnCount = square.pawns[opponent.userId];
        square.pawns = { [userId]: Math.min(enemyPawnCount + 1, 4) };
      } else {
        // Normal behavior: Override opponent's pawns
        square.pawns = { [userId]: 1 };
      }
    } else {
      // Reset own pawns or set to 1
      square.pawns = { [userId]: 1 };
    }

    // Add pawns to locations based on card's pawnLocations
    if (card.pawnLocations && card.pawnLocations.length > 0) {
      // Get player direction multiplier (home = 1, away = -1)
      const directionMultiplier = player.position === 'away' ? -1 : 1;

      for (const pawnLoc of card.pawnLocations) {
        // Flip relativeX for 'away' player (right-to-left movement)
        const targetX = x + (pawnLoc.relativeX * directionMultiplier);
        const targetY = y + pawnLoc.relativeY;

        if (this._isValidCoordinate(targetX, targetY, gameState.board)) {
          const targetSquare = gameState.board[targetY][targetX];

          // Check if target square has enemy pawns and player has Sephiroth ability
          if (targetSquare.pawns[opponent.userId] && hasSephirothAbility) {
            // Sephiroth ability: accumulate enemy pawns
            const enemyPawnCount = targetSquare.pawns[opponent.userId];
            const pawnsToAdd = pawnLoc.pawnCount || 1;
            targetSquare.pawns[userId] = Math.min(enemyPawnCount + pawnsToAdd, 4);
            // Remove enemy pawns since we're taking over
            delete targetSquare.pawns[opponent.userId];
          } else {
            // Normal behavior: add to existing pawns or create new
            targetSquare.pawns[userId] = Math.min(
              (targetSquare.pawns[userId] || 0) + (pawnLoc.pawnCount || 1),
              4 // Max 4 pawns per square
            );
          }
        }
      }
    }

    // Remove card from hand
    player.hand.splice(handCardIndex, 1);

    // Reset consecutive skip counter for BOTH players when a card is played
    player.consecutiveSkips = 0;
    opponent.consecutiveSkips = 0;

    // Reset total skips counter when a card is played (consecutive broken)
    if (gameState.totalSkips) {
      gameState.totalSkips = 0;
    }

    // Recalculate scores
    this._calculateScores(gameState);

    // Check for game end
    const gameEnded = this._checkGameEnd(gameState);
    
    if (gameEnded) {
      gameState.phase = 'ended';
      gameState.status = 'completed';
      
      // Award coins to winner (2 coins)
      const winner = this._determineWinner(gameState);
      if (winner) {
        winner.coinsEarned = 2;
        // Award coins in database
        await this.gachaService.awardCoins(winner.userId, 2);
      }
      
      // Save to MongoDB
      await this._saveCompletedGame(gameState);
      
      await this.updateGameState(gameId, gameState);
      return gameState;
    }

    // Switch turn (no drawing when playing card - only on skip)
    gameState.currentTurn = opponent.userId;
    gameState.turnNumber++;

    await this.updateGameState(gameId, gameState);

    return gameState;
  }

  /**
   * Skip turn (draw one card, max 3 consecutive skips allowed)
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

    const player = gameState.players[userId];
    const opponent = Object.values(gameState.players).find(p => p.userId !== userId);

    // Check consecutive skip limit
    if (player.consecutiveSkips >= 3) {
      throw new Error('Cannot skip more than 3 times consecutively');
    }

    // Increment skip counter for this player
    player.consecutiveSkips++;

    // Initialize total skips counter if not exists
    if (!gameState.totalSkips) {
      gameState.totalSkips = 0;
    }
    gameState.totalSkips++;

    // Check if game should auto-end (6 total skips)
    if (gameState.totalSkips >= 6) {
      console.log(`🎯 Game ${gameId} auto-ending due to 6 total skips`);

      try {
        // Calculate final scores
        this._calculateScores(gameState);

        // End the game
        gameState.phase = 'ended';
        gameState.status = 'completed';

        const winner = this._determineWinner(gameState);

        // Save completed game to MongoDB
        await this._saveCompletedGame(gameState);

        // Update game state
        await this.updateGameState(gameId, gameState);

        return {
          ...gameState,
          endReason: 'total_skips',
          endMessage: 'Game ended - both players skipped 6 times total',
          winner: winner ? winner.userId : null
        };
      } catch (error) {
        console.error('Error saving game after 6 skips:', error);
        console.error('Game state:', JSON.stringify(gameState, null, 2));
        throw error;
      }
    }

    // Draw card for current player (who skipped)
    if (player.deck.length > 0) {
      const drawnCardId = player.deck.shift();
      const drawnCard = await this.cardRepository.findById(drawnCardId);

      if (drawnCard) {
        // Convert mongoose document to plain object and include all card properties
        const cardData = drawnCard.toObject ? drawnCard.toObject() : drawnCard;

        player.hand.push({
          cardId: cardData._id.toString(),
          name: cardData.name,
          power: cardData.power,
          rarity: cardData.rarity,
          cardType: cardData.cardType,
          pawnRequirement: cardData.pawnRequirement,
          pawnLocations: cardData.pawnLocations,
          ability: cardData.ability,
          cardInfo: cardData.cardInfo,
          cardImage: cardData.cardImage
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
                 originalSquare.owner ? 'opponent' : null,
          // Transform ability locations if they exist
          abilityLocations: originalSquare.abilityLocations ? 
            originalSquare.abilityLocations.map(loc => ({
              x: width - 1 - loc.x,
              y: height - 1 - loc.y
            })) : undefined
        };

        transformed.board[newY][newX] = transformedSquare;
      }
    }

    // Transform player data for perspective
    const homePlayer = Object.values(gameState.players).find(p => p.userId !== awayPlayerId);
    const awayPlayer = gameState.players[awayPlayerId];

    // Reverse row scores to match the flipped board perspective
    // When board is flipped 180°, row 0 appears at bottom (visual position 2)
    // So rowScores must be reversed: [row0, row1, row2] -> [row2, row1, row0]
    const reversedAwayScores = [
      awayPlayer.rowScores[2],
      awayPlayer.rowScores[1],
      awayPlayer.rowScores[0]
    ];

    const reversedHomeScores = [
      homePlayer.rowScores[2],
      homePlayer.rowScores[1],
      homePlayer.rowScores[0]
    ];

    transformed.me = {
      ...awayPlayer,
      position: 'home', // Away player sees themselves as home
      rowScores: reversedAwayScores
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
      rowScores: reversedHomeScores
    };

    // Remove full player data
    delete transformed.players;

    return transformed;
  }

  /**
   * Calculate pawn locations based on card (where pawns will be added)
   * @private
   */
  _calculatePawnLocations(card, x, y, board, player) {
    if (!card.pawnLocations) return [];

    const locations = [];
    const width = board[0].length;
    const height = board.length;

    // Get player direction multiplier (home = 1, away = -1)
    const directionMultiplier = player && player.position === 'away' ? -1 : 1;

    for (const pawnLoc of card.pawnLocations) {
      // Flip relativeX for 'away' player (right-to-left movement)
      const targetX = x + (pawnLoc.relativeX * directionMultiplier);
      const targetY = y + pawnLoc.relativeY;

      if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
        locations.push({ x: targetX, y: targetY });
      }
    }

    return locations;
  }

  /**
   * Calculate ability effect locations (where buff/debuff affects)
   * Returns locations with effect type for visual preview
   * @private
   */
  _calculateAbilityLocations(card, x, y, board, player) {
    if (!card.ability || !card.ability.abilityLocations) return [];

    const locations = [];
    const width = board[0].length;
    const height = board.length;

    // Determine effect type (buff or debuff)
    let effectType = null;
    if (card.ability.effectType === 'scoreBoost' ||
        (card.ability.effectType === 'multiplier' && card.ability.effectValue >= 1.0)) {
      effectType = 'buff';
    } else if (card.ability.effectType === 'scoreReduction' ||
               (card.ability.effectType === 'multiplier' && card.ability.effectValue < 1.0)) {
      effectType = 'debuff';
    }

    // Get player direction multiplier (home = 1, away = -1)
    const directionMultiplier = player && player.position === 'away' ? -1 : 1;

    for (const abilityLoc of card.ability.abilityLocations) {
      // Flip relativeX for 'away' player (right-to-left movement)
      const targetX = x + (abilityLoc.relativeX * directionMultiplier);
      const targetY = y + abilityLoc.relativeY;

      // Only include valid coordinates
      if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < height) {
        locations.push({
          x: targetX,
          y: targetY,
          effectType: effectType // Add effect type for preview coloring
        });
      }
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
          const cardOwner = square.owner;
          const cardOwnerPlayer = gameState.players[cardOwner];

          // Apply character passive abilities (cardPowerBoost, scoreMultiplier)
          if (cardOwnerPlayer?.character?.abilities) {
            cardScore = this._applyCharacterAbilitiesToCard(
              cardScore,
              cardOwnerPlayer.character.abilities,
              square.card,
              y // Pass row index for Cloud's ability
            );
          }

          // Apply Cloud's Omnislash debuff to enemy cards in row 2 (center row)
          // Check all players for Cloud ability and apply debuff to their enemies
          players.forEach(playerId => {
            const player = gameState.players[playerId];
            if (this._checkCloudAbility(player.character) && playerId !== cardOwner && y === 1) {
              // This player has Cloud and the card belongs to enemy in row 2
              cardScore -= 2; // Apply -2 debuff
            }
          });

          // Apply Sephiroth's Octaslash debuff to all enemy cards on entire board
          // Check all players for Sephiroth ability and apply -1 debuff to their enemies
          players.forEach(playerId => {
            const player = gameState.players[playerId];
            if (this._checkSephirothAbility(player.character) && playerId !== cardOwner) {
              // This player has Sephiroth and the card belongs to enemy
              cardScore -= 1; // Apply -1 debuff to all enemy cards
            }
          });

          // Apply buff/debuff effects from ALL cards on board
          let totalDebuffReduction = 0;

          // Check if card owner has debuffReduction from character
          if (cardOwnerPlayer?.character?.abilities) {
            totalDebuffReduction = this._getDebuffReduction(cardOwnerPlayer.character.abilities);
          }

          for (let checkY = 0; checkY < board.length; checkY++) {
            for (let checkX = 0; checkX < board[checkY].length; checkX++) {
              const checkSquare = board[checkY][checkX];

              if (checkSquare.card && checkSquare.card.ability && checkSquare.abilityLocations) {
                // Check if current square is affected by this card's ability
                const isAffected = checkSquare.abilityLocations.some(
                  loc => loc.x === x && loc.y === y
                );

                if (isAffected) {
                  const ability = checkSquare.card.ability;

                  if (ability.effectType === 'scoreBoost') {
                    cardScore += ability.effectValue;
                  } else if (ability.effectType === 'scoreReduction') {
                    // Apply debuff reduction if available
                    let debuffValue = Math.abs(ability.effectValue);
                    if (totalDebuffReduction > 0) {
                      debuffValue = debuffValue * (1 - totalDebuffReduction);
                    }
                    cardScore -= debuffValue;
                  } else if (ability.effectType === 'multiplier') {
                    // Check if this is a debuff multiplier (< 1.0)
                    if (ability.effectValue < 1.0 && totalDebuffReduction > 0) {
                      // Reduce the debuff effect
                      // Convert multiplier to debuff amount: 0.7 means 30% reduction
                      const debuffAmount = 1.0 - ability.effectValue; // 0.3
                      const reducedDebuff = debuffAmount * (1 - totalDebuffReduction);
                      const newMultiplier = 1.0 - reducedDebuff;
                      cardScore *= newMultiplier;
                    } else {
                      cardScore *= ability.effectValue;
                    }
                  }
                }
              }
            }
          }

          rowScores[square.owner] += Math.max(0, cardScore); // Ensure non-negative
        }
      }

      // Apply active row multipliers (Tifa's Somersault ability)
      // Check if any player has activated a multiplier for this row
      players.forEach(playerId => {
        const player = gameState.players[playerId];
        if (player.activeRowMultipliers && player.activeRowMultipliers[y]) {
          const multiplier = player.activeRowMultipliers[y];
          rowScores[playerId] *= multiplier;
          console.log(`🎯 Applied ${multiplier}x multiplier to row ${y} for ${player.username}`);
        }
      });

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

    // After calculating scores, mark squares with active buff/debuff effects
    this._markSquareEffects(gameState);
  }

  /**
   * Mark each square with its active buff/debuff effects for visual display
   * This adds 'activeEffects' array to each square: ['buff', 'debuff', or both]
   * @private
   */
  _markSquareEffects(gameState) {
    const board = gameState.board;

    // Reset all square effects
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        board[y][x].activeEffects = [];
      }
    }

    // Check all squares for cards with abilities
    for (let checkY = 0; checkY < board.length; checkY++) {
      for (let checkX = 0; checkX < board[checkY].length; checkX++) {
        const checkSquare = board[checkY][checkX];

        // If this square has a card with ability locations
        if (checkSquare.card && checkSquare.card.ability && checkSquare.abilityLocations) {
          const ability = checkSquare.card.ability;

          // Determine effect type
          let effectType = null;
          if (ability.effectType === 'scoreBoost' ||
              (ability.effectType === 'multiplier' && ability.effectValue >= 1.0)) {
            effectType = 'buff';
          } else if (ability.effectType === 'scoreReduction' ||
                     (ability.effectType === 'multiplier' && ability.effectValue < 1.0)) {
            effectType = 'debuff';
          }

          // Mark all affected squares
          if (effectType) {
            for (const loc of checkSquare.abilityLocations) {
              if (loc.x >= 0 && loc.x < board[0].length && loc.y >= 0 && loc.y < board.length) {
                const targetSquare = board[loc.y][loc.x];
                if (!targetSquare.activeEffects.includes(effectType)) {
                  targetSquare.activeEffects.push(effectType);
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Apply character abilities to card score
   * Handles: cardPowerBoost, scoreMultiplier, placementBonus, specialCondition, debuffCardPower
   * @private
   */
  _applyCharacterAbilitiesToCard(baseScore, abilities, card, rowIndex = null) {
    if (!abilities || !abilities.effects || !Array.isArray(abilities.effects)) {
      return baseScore;
    }

    let modifiedScore = baseScore;

    for (const effect of abilities.effects) {
      // Skip debuffReduction (handled separately)
      if (effect.effectType === 'debuffReduction') continue;

      // Skip pawnBoost (only applies at game start)
      if (effect.effectType === 'pawnBoost') continue;

      // Skip debuffCardPower (applied to enemy cards, handled in main loop)
      if (effect.effectType === 'debuffCardPower') continue;

      // cardPowerBoost - adds flat power to cards
      if (effect.effectType === 'cardPowerBoost') {
        // Check if condition is met (Cloud's Omnislash: +2 power in row 2)
        if (this._checkAbilityCondition(effect.condition, card, rowIndex)) {
          modifiedScore += effect.value || 0;
        }
      }

      // scoreMultiplier - multiplies card power
      if (effect.effectType === 'scoreMultiplier') {
        // Check if condition is met
        if (this._checkAbilityCondition(effect.condition, card, rowIndex)) {
          modifiedScore *= effect.value || 1;
        }
      }

      // Other effect types can be added here:
      // - extraDraw (handled during turn logic)
      // - placementBonus (handled during card placement)
      // - specialCondition (custom logic)
    }

    return modifiedScore;
  }

  /**
   * Get total debuff reduction from character abilities
   * @private
   */
  _getDebuffReduction(abilities) {
    if (!abilities || !abilities.effects || !Array.isArray(abilities.effects)) {
      return 0;
    }

    let totalReduction = 0;

    for (const effect of abilities.effects) {
      if (effect.effectType === 'debuffReduction') {
        // Debuff reduction value represents percentage (0.75 = 75% reduction)
        totalReduction += effect.value || 0;
      }
    }

    // Cap at 100% (1.0) reduction
    return Math.min(totalReduction, 1.0);
  }

  /**
   * Check if ability condition is met
   * @private
   */
  _checkAbilityCondition(condition, card, rowIndex = null) {
    if (!condition) return true; // No condition = always active

    const conditionLower = condition.toLowerCase();

    // Check pawn requirement conditions
    if (conditionLower.includes('pawn requirement')) {
      const match = conditionLower.match(/pawn requirement is (\d+)/);
      if (match) {
        const requiredPawns = parseInt(match[1]);
        return card.pawnRequirement === requiredPawns;
      }
    }

    // Check row conditions (Cloud's Omnislash: row 2 / center row)
    if (conditionLower.includes('row2') || conditionLower.includes('center row')) {
      return rowIndex === 1; // Row 2 is index 1 (0-indexed: row1=0, row2=1, row3=2)
    }

    // Check card type conditions
    if (conditionLower.includes('card type')) {
      // Will be implemented when needed
      return false;
    }

    // Check adjacency conditions
    if (conditionLower.includes('adjacent')) {
      // This would require board context - return true for now
      // Will be implemented when needed
      return true;
    }

    // Default: condition is always active for passive/continuous abilities
    return true;
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
   * Determine winner
   * @private
   */
  _determineWinner(gameState) {
    const players = Object.values(gameState.players);
    const [playerA, playerB] = players;

    if (playerA.totalScore > playerB.totalScore) {
      return playerA;
    } else if (playerB.totalScore > playerA.totalScore) {
      return playerB;
    }
    
    return null; // Draw
  }

  /**
   * Save completed game (update user stats and coins only, no game record)
   * @private
   */
  async _saveCompletedGame(gameState) {
    const players = Object.values(gameState.players);
    const [playerA, playerB] = players;

    // Determine winner (use gameState.winner if already set, otherwise calculate)
    let winnerId = gameState.winner;
    if (!winnerId) {
      if (playerA.totalScore > playerB.totalScore) {
        winnerId = playerA.userId;
      } else if (playerB.totalScore > playerA.totalScore) {
        winnerId = playerB.userId;
      }
    }

    // Determine status (use gameState.status if already set)
    const status = gameState.status || 'completed';

    console.log('💾 Saving game completion - updating user stats and coins');
    console.log(`   Winner: ${winnerId || 'Draw'}`);
    console.log(`   Status: ${status}`);

    // Update user stats and award coins
    if (status === 'completed') {
      // Normal game completion - both players get stats update
      if (winnerId) {
        // There's a winner - one wins, one loses
        for (const player of players) {
          const result = player.userId === winnerId ? 'win' : 'loss';
          console.log(`   Updating ${player.username}: ${result}`);
          await this.userRepository.updateGameStats(player.userId, result);
        }
        // Award 1 coin to winner
        console.log(`   Awarding 1 coin to winner`);
        await this.userRepository.addCoins(winnerId, 1);
      } else {
        // Draw - both players get totalGames incremented but no wins/losses
        console.log(`   Draw - both players get totalGames +1`);
        for (const player of players) {
          await this.userRepository.updateGameStats(player.userId, 'draw');
        }
      }
    } else if (status === 'abandoned' && winnerId) {
      // For abandoned games, winner gets win+coin, loser gets loss
      const loserId = players.find(p => p.userId !== winnerId)?.userId;

      console.log(`   Abandoned game - winner: ${winnerId}, loser: ${loserId}`);
      await this.userRepository.updateGameStats(winnerId, 'win');
      await this.userRepository.addCoins(winnerId, 1);

      if (loserId) {
        await this.userRepository.updateGameStats(loserId, 'loss');
      }
    }

    console.log('✅ User stats and coins updated successfully');

    // Delete lobby
    await this.lobbyRepository.deleteById(gameState.lobbyId);
    console.log('✅ Lobby deleted');
  }

  /**
   * Initialize board based on map
   * @private
   */
  _initializeBoard(map, playerAId, playerBId, characterA = null, characterB = null) {
    const height = map.gridSize?.height || 3;
    const width = map.gridSize?.width || 6;

    const board = Array(height).fill(null).map((_, y) =>
      Array(width).fill(null).map((_, x) => ({
        x,
        y,
        card: null,
        owner: null,
        pawns: {}, // { playerId: pawnCount }
        special: this._getSpecialSquareEffect(map, x, y),
        abilityLocations: undefined, // Will be set when cards with abilities are placed
        activeEffects: [] // Array of active effects: ['buff', 'debuff']
      }))
    );

    // Calculate starting pawns based on character abilities
    let playerAPawns = 1; // Default starting pawns
    let playerBPawns = 1;

    // Apply character start_game abilities (passive abilities that affect game start)
    if (characterA?.abilities) {
      const newPawns = this._applyStartGameAbility(characterA.abilities, playerAPawns);
      if (newPawns !== playerAPawns) {
        console.log(`✨ Player A (${characterA.name}) ability applied: ${playerAPawns} → ${newPawns} starting pawns`);
      }
      playerAPawns = newPawns;
    }
    if (characterB?.abilities) {
      const newPawns = this._applyStartGameAbility(characterB.abilities, playerBPawns);
      if (newPawns !== playerBPawns) {
        console.log(`✨ Player B (${characterB.name}) ability applied: ${playerBPawns} → ${newPawns} starting pawns`);
      }
      playerBPawns = newPawns;
    }

    // Add initial pawns (players start with pawns on each row on their side)
    // Player A (home) starts on the LEFT (column 0) for all rows
    // Player B (away) starts on the RIGHT (last column) for all rows
    for (let row = 0; row < height; row++) {
      board[row][0].pawns[playerAId] = playerAPawns; // Left side (column 0)
      board[row][width - 1].pawns[playerBId] = playerBPawns; // Right side (last column)
    }

    return board;
  }

  /**
   * Apply start_game character ability effects
   * Currently only supports passive abilities with pawnBoost at start of game
   * Other ability types will be implemented later
   * @private
   */
  _applyStartGameAbility(abilities, basePawns) {
    // Only process passive abilities for now
    if (abilities.abilityType !== 'passive') {
      return basePawns;
    }

    if (!abilities.effects || !Array.isArray(abilities.effects)) {
      return basePawns;
    }

    let totalPawns = basePawns;

    for (const effect of abilities.effects) {
      // Check for specific start of game pawnBoost ability
      if (effect.condition === 'start of game' && effect.effectType === 'pawnBoost') {
        totalPawns += effect.value || 0;
      }
      // Other ability types (continuous, triggered, etc.) will be implemented later
    }

    return totalPawns;
  }

  /**
   * Check if character has Sephiroth's Octaslash ability
   * This ability allows accumulating enemy pawns instead of replacing them
   * @param {Object} character - Character object with abilities
   * @returns {boolean} - True if character has Sephiroth ability
   * @private
   */
  _checkSephirothAbility(character) {
    if (!character || !character.abilities) {
      return false;
    }

    const abilities = character.abilities;

    // Check if this is Sephiroth's Octaslash ability
    // Triggered ability with specialCondition on card placement
    if (abilities.abilityType === 'triggered' &&
        abilities.skillName === 'Octaslash') {

      // Verify it has the correct effect
      if (abilities.effects && Array.isArray(abilities.effects)) {
        const hasOctaslashEffect = abilities.effects.some(effect =>
          effect.effectType === 'specialCondition' &&
          effect.condition && effect.condition.includes('when place card')
        );

        return hasOctaslashEffect;
      }
    }

    return false;
  }

  /**
   * Check if character has Tifa's Somersault ability
   * This ability doubles row score if it's greater than 5
   * @param {Object} character - Character object with abilities
   * @returns {boolean} - True if character has Tifa ability
   * @private
   */
  _checkTifaAbility(character) {
    if (!character || !character.abilities) {
      return false;
    }

    const abilities = character.abilities;

    // Check if this is Tifa's Somersault ability
    // Triggered ability with scoreMultiplier when row score > 5
    if (abilities.abilityType === 'triggered' &&
        abilities.skillName === 'Somersault') {

      // Verify it has the correct effect
      if (abilities.effects && Array.isArray(abilities.effects)) {
        const hasSomersaultEffect = abilities.effects.some(effect =>
          effect.effectType === 'scoreMultiplier' &&
          effect.value === 2 &&
          effect.condition && effect.condition.toLowerCase().includes('score')
        );

        return hasSomersaultEffect;
      }
    }

    return false;
  }

  /**
   * Check if character has Cloud's Omnislash ability
   * This ability boosts own cards and debuffs enemy cards in row 2 (center row)
   * @param {Object} character - Character object with abilities
   * @returns {boolean} - True if character has Cloud ability
   * @private
   */
  _checkCloudAbility(character) {
    if (!character || !character.abilities) {
      return false;
    }

    const abilities = character.abilities;

    // Check if this is Cloud's Omnislash ability
    // Passive ability with cardPowerBoost and debuffCardPower in row 2
    if (abilities.abilityType === 'passive' &&
        abilities.skillName === 'Omnislash') {

      // Verify it has the correct effects
      if (abilities.effects && Array.isArray(abilities.effects)) {
        const hasOmnislashEffects = abilities.effects.some(effect =>
          (effect.effectType === 'cardPowerBoost' || effect.effectType === 'debuffCardPower') &&
          effect.condition && (
            effect.condition.toLowerCase().includes('row2') ||
            effect.condition.toLowerCase().includes('center row')
          )
        );

        return hasOmnislashEffects;
      }
    }

    return false;
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