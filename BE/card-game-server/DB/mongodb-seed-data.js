// MongoDB Seed Data Script - Queen's Blood Style Game
// Run this after initializing the schema
// mongosh <connection-string> < mongodb-seed-data-queens-blood.js

const dbName = 'board_game_db';
use(dbName);

print('Starting seed data insertion for Queen\'s Blood style game...\n');

// ========================================
// SEED CHARACTERS (Passive Abilities Only)
// Characters help the owner player, no combat stats
// ========================================
print('Inserting characters with passive abilities...');

const characters = [
  {
    name: 'Strategist Knight',
    characterPic: '/characters/strategist-knight.png',
    rarity: 'common',
    description: 'A tactical master who enhances card placement efficiency',
    abilities: {
      skillName: 'Tactical Placement',
      skillDescription: 'All your cards placed adjacent to each other gain +1 power',
      abilityType: 'continuous',
      effects: [
        {
          effectType: 'cardPowerBoost',
          value: 1,
          condition: 'when cards are adjacent',
          target: 'all your cards'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Shadow Tactician',
    characterPic: '/characters/shadow-tactician.png',
    rarity: 'rare',
    description: 'A mysterious strategist who weakens enemy positions',
    abilities: {
      skillName: 'Shadow Influence',
      skillDescription: 'Enemy debuff cards have their effect increased by 50%',
      abilityType: 'continuous',
      effects: [
        {
          effectType: 'specialCondition',
          value: 1.5,
          condition: 'enemy plays debuff card',
          target: 'enemy debuff effects'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Mystic Enchanter',
    characterPic: '/characters/mystic-enchanter.png',
    rarity: 'epic',
    description: 'A powerful mage who amplifies buff card effects',
    abilities: {
      skillName: 'Amplify Magic',
      skillDescription: 'Your buff cards affect one additional adjacent square',
      abilityType: 'continuous',
      effects: [
        {
          effectType: 'placementBonus',
          value: 1,
          condition: 'when you play buff card',
          target: 'buff ability range'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Grand Architect',
    characterPic: '/characters/grand-architect.png',
    rarity: 'legendary',
    description: 'A legendary builder who maximizes board control',
    abilities: {
      skillName: 'Master Planning',
      skillDescription: 'At the start of your turn, if you control 3+ rows, gain +2 power on all your cards',
      abilityType: 'triggered',
      effects: [
        {
          effectType: 'scoreMultiplier',
          value: 2,
          condition: 'control 3+ rows',
          target: 'all your cards'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Swift Striker',
    characterPic: '/characters/swift-striker.png',
    rarity: 'common',
    description: 'An agile fighter who enables quick plays',
    abilities: {
      skillName: 'Quick Deploy',
      skillDescription: 'Cards with pawn requirement 1 gain +1 power',
      abilityType: 'passive',
      effects: [
        {
          effectType: 'cardPowerBoost',
          value: 1,
          condition: 'pawn requirement is 1',
          target: 'your cards with pawn requirement 1'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const insertedCharacters = db.characters.insertMany(characters);
print(`✓ Inserted ${insertedCharacters.insertedIds.length} characters with passive abilities`);

// ========================================
// SEED CARDS (Queen's Blood Mechanics)
// 3 types: standard, buff, debuff
// Pawn requirements: 1-4
// ========================================
print('Inserting cards with Queen\'s Blood mechanics...');

const cards = [
  // === STANDARD CARDS (No Ability) ===
  {
    name: 'Basic Pawn',
    power: 2,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Simple card that adds pawns to adjacent left and right squares',
    cardImage: '/cards/basic-pawn.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Forward Push',
    power: 3,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Adds a pawn to the square directly above',
    cardImage: '/cards/forward-push.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Cross Formation',
    power: 4,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Powerful card that adds pawns in a cross pattern. Requires 2 pawns.',
    cardImage: '/cards/cross-formation.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Mighty Fortress',
    power: 6,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'High power card with wide pawn spread. Requires 3 pawns.',
    cardImage: '/cards/mighty-fortress.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Ultimate Dominion',
    power: 8,
    rarity: 'legendary',
    cardType: 'standard',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Maximum power card with massive pawn generation. Requires 4 pawns.',
    cardImage: '/cards/ultimate-dominion.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // === BUFF CARDS (Increase Square Scores) ===
  {
    name: 'Inspiring Presence',
    power: 2,
    rarity: 'common',
    cardType: 'buff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases score of adjacent square by +2',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 }
      ],
      effectType: 'scoreBoost',
      effectValue: 2
    },
    cardInfo: 'Buffs the right adjacent square',
    cardImage: '/cards/inspiring-presence.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Rally Banner',
    power: 3,
    rarity: 'rare',
    cardType: 'buff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases score of top and bottom squares by +3 each',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: -1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 3
    },
    cardInfo: 'Powerful vertical buff. Requires 2 pawns.',
    cardImage: '/cards/rally-banner.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Divine Blessing',
    power: 4,
    rarity: 'epic',
    cardType: 'buff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Multiplies score of all adjacent squares by 1.5x',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: -1 }
      ],
      effectType: 'multiplier',
      effectValue: 1.5
    },
    cardInfo: 'Provides a powerful score multiplier to surrounding squares. Requires 3 pawns.',
    cardImage: '/cards/divine-blessing.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Royal Decree',
    power: 5,
    rarity: 'legendary',
    cardType: 'buff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases score of entire row by +5',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 2, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: -2, relativeY: 0 }
      ],
      effectType: 'scoreBoost',
      effectValue: 5
    },
    cardInfo: 'Ultimate buff affecting entire row. Requires 4 pawns.',
    cardImage: '/cards/royal-decree.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // === DEBUFF CARDS (Decrease Enemy Square Scores) ===
  {
    name: 'Shadow Strike',
    power: 2,
    rarity: 'common',
    cardType: 'debuff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces enemy square score by -2',
      abilityLocations: [
        { relativeX: 2, relativeY: 0 }
      ],
      effectType: 'scoreReduction',
      effectValue: -2
    },
    cardInfo: 'Basic debuff targeting enemy territory',
    cardImage: '/cards/shadow-strike.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Curse of Weakness',
    power: 3,
    rarity: 'rare',
    cardType: 'debuff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces score of 2 forward squares by -3 each',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: 2 }
      ],
      effectType: 'scoreReduction',
      effectValue: -3
    },
    cardInfo: 'Forward-pushing debuff. Requires 2 pawns.',
    cardImage: '/cards/curse-weakness.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Plague Cloud',
    power: 4,
    rarity: 'epic',
    cardType: 'debuff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces score of all enemy cards in cross pattern by -4',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: -1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -4
    },
    cardInfo: 'Wide-area debuff. Requires 3 pawns.',
    cardImage: '/cards/plague-cloud.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Absolute Nullification',
    power: 5,
    rarity: 'legendary',
    cardType: 'debuff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces enemy column score by 50%',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: 2 },
        { relativeX: 0, relativeY: -1 },
        { relativeX: 0, relativeY: -2 }
      ],
      effectType: 'multiplier',
      effectValue: 0.5
    },
    cardInfo: 'Devastating column debuff. Requires 4 pawns.',
    cardImage: '/cards/absolute-nullification.png',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const insertedCards = db.cards.insertMany(cards);
print(`✓ Inserted ${insertedCards.insertedIds.length} cards (${cards.filter(c => c.cardType === 'standard').length} standard, ${cards.filter(c => c.cardType === 'buff').length} buff, ${cards.filter(c => c.cardType === 'debuff').length} debuff)`);

// ========================================
// SEED MAPS
// ========================================
print('Inserting maps...');

const maps = [
  {
    name: 'Starter Arena',
    image: '/maps/starter-arena.png',
    themeColor: '#4CAF50',
    gridSize: {
      width: 5,
      height: 3
    },
    specialSquares: [
      {
        position: { x: 2, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      }
    ],
    difficulty: 'easy',
    createdAt: new Date()
  },
  {
    name: 'Tactical Battlefield',
    image: '/maps/tactical-battlefield.png',
    themeColor: '#FF5722',
    gridSize: {
      width: 7,
      height: 3
    },
    specialSquares: [
      {
        position: { x: 1, y: 1 },
        type: 'bonus',
        effect: { scorebonus: 3 }
      },
      {
        position: { x: 5, y: 1 },
        type: 'bonus',
        effect: { scorebonus: 3 }
      },
      {
        position: { x: 3, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 2.0 }
      }
    ],
    difficulty: 'medium',
    createdAt: new Date()
  },
  {
    name: 'Strategic Colosseum',
    image: '/maps/strategic-colosseum.png',
    themeColor: '#2196F3',
    gridSize: {
      width: 9,
      height: 3
    },
    specialSquares: [
      {
        position: { x: 2, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 6, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 4, y: 1 },
        type: 'restricted',
        effect: { cannotPlace: true }
      }
    ],
    difficulty: 'hard',
    createdAt: new Date()
  },
  {
    name: 'Grandmaster\'s Court',
    image: '/maps/grandmaster-court.png',
    themeColor: '#9C27B0',
    gridSize: {
      width: 9,
      height: 5
    },
    specialSquares: [
      {
        position: { x: 4, y: 2 },
        type: 'special',
        effect: { scoreMultiplier: 3.0 }
      },
      {
        position: { x: 2, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 6, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 2, y: 3 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 6, y: 3 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      }
    ],
    difficulty: 'expert',
    createdAt: new Date()
  }
];

const insertedMaps = db.maps.insertMany(maps);
print(`✓ Inserted ${insertedMaps.insertedIds.length} maps`);

// ========================================
// SEED TEST USER (Optional - for development)
// ========================================
print('Inserting test user...');

const testUser = {
  uid: 'test-user-001',
  username: 'testplayer',
  email: 'test@example.com',
  password: '$argon2id$v=19$m=65536,t=3,p=4$placeholder', // Replace with real hash
  displayName: 'Test Player',
  stats: {
    winRate: 0,
    totalGames: 0,
    wins: 0,
    losses: 0
  },
  gameHistory: [],
  isOnline: false,
  lastLogin: new Date(),
  profilePic: '/avatars/default.png',
  isEmailVerified: true,
  friends: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const insertedUser = db.users.insertOne(testUser);
print(`✓ Inserted test user with ID: ${insertedUser.insertedId}`);

// Create inventory for test user
const testInventory = {
  userId: insertedUser.insertedId,
  cards: [
    { cardId: insertedCards.insertedIds['0'], quantity: 3, acquiredAt: new Date() }, // Basic Pawn
    { cardId: insertedCards.insertedIds['1'], quantity: 3, acquiredAt: new Date() }, // Forward Push
    { cardId: insertedCards.insertedIds['2'], quantity: 2, acquiredAt: new Date() }, // Cross Formation
    { cardId: insertedCards.insertedIds['5'], quantity: 2, acquiredAt: new Date() }, // Inspiring Presence
    { cardId: insertedCards.insertedIds['9'], quantity: 1, acquiredAt: new Date() }  // Shadow Strike
  ],
  characters: [
    { characterId: insertedCharacters.insertedIds['0'], acquiredAt: new Date() },
    { characterId: insertedCharacters.insertedIds['1'], acquiredAt: new Date() }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};

const insertedInventory = db.inventories.insertOne(testInventory);
print(`✓ Created inventory for test user`);

// Update user with inventory reference
db.users.updateOne(
  { _id: insertedUser.insertedId },
  { $set: { inventory: insertedInventory.insertedId } }
);

// Create test deck for user
const testDeck = {
  deckTitle: 'Starter Deck',
  userId: insertedUser.insertedId,
  cards: [
    { cardId: insertedCards.insertedIds['0'], position: 0 }, // Basic Pawn
    { cardId: insertedCards.insertedIds['0'], position: 1 }, // Basic Pawn
    { cardId: insertedCards.insertedIds['0'], position: 2 }, // Basic Pawn
    { cardId: insertedCards.insertedIds['1'], position: 3 }, // Forward Push
    { cardId: insertedCards.insertedIds['1'], position: 4 }, // Forward Push
    { cardId: insertedCards.insertedIds['5'], position: 5 }, // Inspiring Presence
    { cardId: insertedCards.insertedIds['5'], position: 6 }  // Inspiring Presence
  ],
  characterId: insertedCharacters.insertedIds['0'], // Strategist Knight
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

db.decks.insertOne(testDeck);
print(`✓ Created starter deck for test user`);

// ========================================
// PRINT SUMMARY
// ========================================
print('\n========================================');
print('Seed Data Insertion Complete!');
print('Queen\'s Blood Style Game Database');
print('========================================');
print(`Characters: ${insertedCharacters.insertedIds.length} (passive abilities only)`);
print(`Cards: ${insertedCards.insertedIds.length}`);
print(`  - Standard (no ability): ${cards.filter(c => c.cardType === 'standard').length}`);
print(`  - Buff (increase score): ${cards.filter(c => c.cardType === 'buff').length}`);
print(`  - Debuff (decrease score): ${cards.filter(c => c.cardType === 'debuff').length}`);
print(`Maps: ${insertedMaps.insertedIds.length}`);
print(`Test Users: 1`);
print('========================================');
print('\nCard Mechanics Summary:');
print('  • Pawn Requirements: 1-4 pawns needed to place');
print('  • Standard Cards: High power, no ability');
print('  • Buff Cards: Increase square scores');
print('  • Debuff Cards: Decrease enemy scores');
print('  • Higher pawn requirement = Better card');
print('========================================');
print('\nTest User Credentials:');
print('Username: testplayer');
print('Email: test@example.com');
print('Note: Password needs to be set via API with proper Argon2 hashing');
print('========================================\n');

// Show collection counts
print('Collection Document Counts:');
print(`  users: ${db.users.countDocuments()}`);
print(`  characters: ${db.characters.countDocuments()}`);
print(`  cards: ${db.cards.countDocuments()}`);
print(`  maps: ${db.maps.countDocuments()}`);
print(`  inventories: ${db.inventories.countDocuments()}`);
print(`  decks: ${db.decks.countDocuments()}`);
print('\n========================================');
print('Game Design Notes:');
print('  • Start with 1 pawn on board');
print('  • Place cards to add more pawns');
print('  • Card placement requires matching pawn count');
print('  • Score calculated from cards, not characters');
print('  • Active games run in Redis');
print('  • Completed games stored in MongoDB');
print('========================================');
print('\nDatabase is ready for your Queen\'s Blood game!');
print('========================================\n');