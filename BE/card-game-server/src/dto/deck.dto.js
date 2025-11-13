/**
 * Create Deck Request DTO
 */
class CreateDeckRequestDto {
  constructor({ deckTitle, characterId, cards, isActive }) {
    this.deckTitle = deckTitle?.trim();
    this.characterId = characterId?.trim();
    this.cards = cards || [];
    this.isActive = isActive || false;
  }
}

/**
 * Update Deck Request DTO
 */
class UpdateDeckRequestDto {
  constructor({ deckTitle, characterId, cards, isActive }) {
    // Only include provided fields
    if (deckTitle !== undefined) this.deckTitle = deckTitle?.trim();
    if (characterId !== undefined) this.characterId = characterId?.trim();
    if (cards !== undefined) this.cards = cards;
    if (isActive !== undefined) this.isActive = isActive;
  }
}

/**
 * Card in Deck DTO
 */
class DeckCardDto {
  constructor(card) {
    this.cardId = card.cardId?._id || card.cardId;
    this.position = card.position;
    
    // If card is populated, include card details
    if (card.cardId?.name) {
      this.name = card.cardId.name;
      this.power = card.cardId.power;
      this.rarity = card.cardId.rarity;
      this.cardType = card.cardId.cardType;
      this.cardImage = card.cardId.cardImage;
      this.pawnRequirement = card.cardId.pawnRequirement;
      
      // Include additional details if available
      if (card.cardId.cardInfo) {
        this.cardInfo = card.cardId.cardInfo;
      }
      if (card.cardId.pawnLocations) {
        this.pawnLocations = card.cardId.pawnLocations;
      }
      if (card.cardId.ability) {
        this.ability = card.cardId.ability;
      }
    }
  }
}

/**
 * Character in Deck DTO
 */
class DeckCharacterDto {
  constructor(character) {
    this.characterId = character._id || character;
    
    // If character is populated, include character details
    if (character.name) {
      this.name = character.name;
      this.characterPic = character.characterPic;
      this.rarity = character.rarity;
      
      // Include additional details if available
      if (character.description) {
        this.description = character.description;
      }
      if (character.abilities) {
        this.abilities = character.abilities;
      }
    }
  }
}

/**
 * Deck Response DTO (full details)
 */
class DeckResponseDto {
  constructor(deck) {
    this.deckId = deck._id?.toString() || deck.deckId;
    this.deckTitle = deck.deckTitle;
    this.userId = deck.userId?.toString();
    this.isActive = deck.isActive || false;
    this.cardCount = deck.cards?.length || 0;
    this.createdAt = deck.createdAt;
    this.updatedAt = deck.updatedAt;
    
    // Character details
    if (deck.characterId) {
      this.character = new DeckCharacterDto(deck.characterId);
    }
    
    // Cards details
    if (deck.cards && deck.cards.length > 0) {
      this.cards = deck.cards.map(card => new DeckCardDto(card));
    }
  }
}

/**
 * Deck Summary DTO (for lists)
 */
class DeckSummaryDto {
  constructor(deck) {
    this.deckId = deck._id?.toString() || deck.deckId;
    this.deckTitle = deck.deckTitle;
    this.isActive = deck.isActive || false;
    this.cardCount = deck.cards?.length || 0;
    this.createdAt = deck.createdAt;
    
    // Character basic info only
    if (deck.characterId) {
      this.character = {
        characterId: deck.characterId._id?.toString() || deck.characterId,
        name: deck.characterId.name,
        characterPic: deck.characterId.characterPic,
        rarity: deck.characterId.rarity
      };
    }
  }
}

/**
 * Deck List Response DTO
 */
class DeckListResponseDto {
  constructor(decks) {
    this.decks = decks.map(deck => new DeckSummaryDto(deck));
    this.count = decks.length;
  }
}

/**
 * Deck Deletion Response DTO
 */
class DeckDeletionResponseDto {
  constructor(deckId) {
    this.deletedDeckId = deckId;
    this.deletedAt = new Date().toISOString();
  }
}

module.exports = {
  CreateDeckRequestDto,
  UpdateDeckRequestDto,
  DeckResponseDto,
  DeckSummaryDto,
  DeckListResponseDto,
  DeckDeletionResponseDto,
  DeckCardDto,
  DeckCharacterDto
};