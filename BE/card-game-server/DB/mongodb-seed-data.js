// MongoDB Seed Data Script
// Run this after initializing the schema
// mongosh <connection-string> < mongodb-seed-data.js

const dbName = 'board_game_db';
use(dbName);

print('Starting seed data insertion...\n');

// ========================================
// SEED CHARACTERS
// ========================================
print('Inserting characters...');

const characters = [
  {
    name: 'Warrior Knight',
    characterPic: '/characters/warrior-knight.png',
    rarity: 'common',
    stats: {
      health: 100,
      attack: 15,
      defense: 10
    },
    abilities: {
      skillDescription: 'Increases attack power of adjacent pawns by 2',
      pawnLocationEffect: { adjacentBoost: 2 },
      scoreEffect: { multiplier: 1.0 },
      buff: { attack: 2, duration: 1 },
      debuff: null,
      addPawn: null,
      dropCardInSquare: null,
      extraPawn: 0,
      reducePawn: 0
    },
    createdAt: new Date()
  },
  {
    name: 'Shadow Assassin',
    characterPic: '/characters/shadow-assassin.png',
    rarity: 'rare',
    stats: {
      health: 80,
      attack: 20,
      defense: 5
    },
    abilities: {
      skillDescription: 'Can move to any empty square once per turn',
      pawnLocationEffect: { teleport: true },
      scoreEffect: { multiplier: 1.2 },
      buff: { speed: 1 },
      debuff: { enemyDefense: -3 },
      addPawn: null,
      dropCardInSquare: null,
      extraPawn: 0,
      reducePawn: 1
    },
    createdAt: new Date()
  },
  {
    name: 'Mystic Mage',
    characterPic: '/characters/mystic-mage.png',
    rarity: 'epic',
    stats: {
      health: 70,
      attack: 25,
      defense: 8
    },
    abilities: {
      skillDescription: 'Draw an extra card each turn',
      pawnLocationEffect: { areaEffect: 2 },
      scoreEffect: { multiplier: 1.5 },
      buff: { cardDraw: 1 },
      debuff: null,
      addPawn: { condition: 'onKill', amount: 1 },
      dropCardInSquare: { radius: 1 },
      extraPawn: 1,
      reducePawn: 0
    },
    createdAt: new Date()
  },
  {
    name: 'Divine Paladin',
    characterPic: '/characters/divine-paladin.png',
    rarity: 'legendary',
    stats: {
      health: 120,
      attack: 18,
      defense: 15
    },
    abilities: {
      skillDescription: 'Heals adjacent pawns and provides damage reduction',
      pawnLocationEffect: { healing: 5, shieldRadius: 1 },
      scoreEffect: { multiplier: 2.0 },
      buff: { defense: 5, health: 10 },
      debuff: null,
      addPawn: { condition: 'onDefend', amount: 1 },
      dropCardInSquare: null,
      extraPawn: 2,
      reducePawn: 0
    },
    createdAt: new Date()
  },
  {
    name: 'Archer Ranger',
    characterPic: '/characters/archer-ranger.png',
    rarity: 'common',
    stats: {
      health: 85,
      attack: 12,
      defense: 7
    },
    abilities: {
      skillDescription: 'Can attack enemies 2 squares away',
      pawnLocationEffect: { range: 2 },
      scoreEffect: { multiplier: 1.1 },
      buff: { range: 1 },
      debuff: null,
      addPawn: null,
      dropCardInSquare: null,
      extraPawn: 0,
      reducePawn: 0
    },
    createdAt: new Date()
  }
];

const insertedCharacters = db.characters.insertMany(characters);
print(`✓ Inserted ${insertedCharacters.insertedIds.length} characters`);

// ========================================
// SEED CARDS
// ========================================
print('Inserting cards...');

const cards = [
  {
    name: 'Strike',
    power: 5,
    rarity: 'common',
    cardType: 'attack',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['adjacent']
    },
    ability: {
      abilityType: 'damage',
      abilityLocation: { target: 'single' },
      description: 'Deal 5 damage to target square',
      effect: { damage: 5 }
    },
    cardInfo: 'Basic attack card that deals moderate damage',
    cardImage: '/cards/strike.png',
    createdAt: new Date()
  },
  {
    name: 'Shield Wall',
    power: 3,
    rarity: 'common',
    cardType: 'defense',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['self']
    },
    ability: {
      abilityType: 'defense',
      abilityLocation: { target: 'self' },
      description: 'Gain 3 defense for this turn',
      effect: { defense: 3, duration: 1 }
    },
    cardInfo: 'Defensive card that blocks incoming damage',
    cardImage: '/cards/shield-wall.png',
    createdAt: new Date()
  },
  {
    name: 'Fireball',
    power: 8,
    rarity: 'rare',
    cardType: 'attack',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['range']
    },
    ability: {
      abilityType: 'areaDamage',
      abilityLocation: { target: 'area', radius: 1 },
      description: 'Deal 8 damage to target square and 4 to adjacent squares',
      effect: { damage: 8, areaDamage: 4, radius: 1 }
    },
    cardInfo: 'Powerful area attack spell',
    cardImage: '/cards/fireball.png',
    createdAt: new Date()
  },
  {
    name: 'Healing Touch',
    power: 4,
    rarity: 'rare',
    cardType: 'support',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['friendly']
    },
    ability: {
      abilityType: 'heal',
      abilityLocation: { target: 'single' },
      description: 'Restore 4 health to target pawn',
      effect: { heal: 4 }
    },
    cardInfo: 'Restore health to damaged units',
    cardImage: '/cards/healing-touch.png',
    createdAt: new Date()
  },
  {
    name: 'Lightning Bolt',
    power: 10,
    rarity: 'epic',
    cardType: 'attack',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['line']
    },
    ability: {
      abilityType: 'pierceDamage',
      abilityLocation: { target: 'line' },
      description: 'Deal 10 damage in a straight line',
      effect: { damage: 10, pierce: true }
    },
    cardInfo: 'Lightning strikes through multiple enemies',
    cardImage: '/cards/lightning-bolt.png',
    createdAt: new Date()
  },
  {
    name: 'Summon Minion',
    power: 6,
    rarity: 'epic',
    cardType: 'special',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['empty']
    },
    ability: {
      abilityType: 'summon',
      abilityLocation: { target: 'empty' },
      description: 'Summon a minion with 6 power',
      effect: { summon: true, power: 6 }
    },
    cardInfo: 'Place a new pawn on the board',
    cardImage: '/cards/summon-minion.png',
    createdAt: new Date()
  },
  {
    name: 'Dragon Rage',
    power: 15,
    rarity: 'legendary',
    cardType: 'attack',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['any']
    },
    ability: {
      abilityType: 'massiveDamage',
      abilityLocation: { target: 'area', radius: 2 },
      description: 'Deal 15 damage to target and 8 to all nearby squares',
      effect: { damage: 15, areaDamage: 8, radius: 2 }
    },
    cardInfo: 'Ultimate attack that devastates the battlefield',
    cardImage: '/cards/dragon-rage.png',
    createdAt: new Date()
  },
  {
    name: 'Time Warp',
    power: 7,
    rarity: 'legendary',
    cardType: 'special',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['any']
    },
    ability: {
      abilityType: 'extraTurn',
      abilityLocation: { target: 'self' },
      description: 'Take an additional turn after this one',
      effect: { extraTurn: 1 }
    },
    cardInfo: 'Bend time to your advantage',
    cardImage: '/cards/time-warp.png',
    createdAt: new Date()
  },
  {
    name: 'Poison Cloud',
    power: 4,
    rarity: 'rare',
    cardType: 'attack',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['area']
    },
    ability: {
      abilityType: 'damageOverTime',
      abilityLocation: { target: 'area', radius: 1 },
      description: 'Deal 4 damage over 2 turns to all enemies in area',
      effect: { damage: 4, duration: 2, dot: 2 }
    },
    cardInfo: 'Lingering poison damages enemies over time',
    cardImage: '/cards/poison-cloud.png',
    createdAt: new Date()
  },
  {
    name: 'Fortify',
    power: 5,
    rarity: 'common',
    cardType: 'defense',
    pawnLocation: {
      x: 0,
      y: 0,
      restrictions: ['friendly']
    },
    ability: {
      abilityType: 'buff',
      abilityLocation: { target: 'single' },
      description: 'Increase target pawn power by 5 permanently',
      effect: { powerIncrease: 5, permanent: true }
    },
    cardInfo: 'Permanently strengthen a pawn',
    cardImage: '/cards/fortify.png',
    createdAt: new Date()
  }
];

const insertedCards = db.cards.insertMany(cards);
print(`✓ Inserted ${insertedCards.insertedIds.length} cards`);

// ========================================
// SEED MAPS
// ========================================
print('Inserting maps...');

const maps = [
  {
    name: 'Grassland Arena',
    image: '/maps/grassland-arena.png',
    themeColor: '#4CAF50',
    gridSize: {
      width: 5,
      height: 3
    },
    specialSquares: [
      {
        position: { x: 2, y: 1 },
        type: 'power',
        effect: { powerMultiplier: 1.5 }
      }
    ],
    difficulty: 'easy',
    createdAt: new Date()
  },
  {
    name: 'Volcanic Battlefield',
    image: '/maps/volcanic-battlefield.png',
    themeColor: '#FF5722',
    gridSize: {
      width: 6,
      height: 4
    },
    specialSquares: [
      {
        position: { x: 1, y: 1 },
        type: 'damage',
        effect: { damagePerTurn: 2 }
      },
      {
        position: { x: 4, y: 2 },
        type: 'damage',
        effect: { damagePerTurn: 2 }
      },
      {
        position: { x: 3, y: 2 },
        type: 'power',
        effect: { powerMultiplier: 2.0 }
      }
    ],
    difficulty: 'medium',
    createdAt: new Date()
  },
  {
    name: 'Frozen Wasteland',
    image: '/maps/frozen-wasteland.png',
    themeColor: '#2196F3',
    gridSize: {
      width: 7,
      height: 4
    },
    specialSquares: [
      {
        position: { x: 2, y: 1 },
        type: 'freeze',
        effect: { skipTurn: true }
      },
      {
        position: { x: 4, y: 2 },
        type: 'freeze',
        effect: { skipTurn: true }
      },
      {
        position: { x: 3, y: 2 },
        type: 'heal',
        effect: { healPerTurn: 3 }
      }
    ],
    difficulty: 'medium',
    createdAt: new Date()
  },
  {
    name: 'Shadow Realm',
    image: '/maps/shadow-realm.png',
    themeColor: '#9C27B0',
    gridSize: {
      width: 8,
      height: 5
    },
    specialSquares: [
      {
        position: { x: 2, y: 2 },
        type: 'void',
        effect: { powerReduction: 0.5 }
      },
      {
        position: { x: 5, y: 2 },
        type: 'void',
        effect: { powerReduction: 0.5 }
      },
      {
        position: { x: 4, y: 2 },
        type: 'power',
        effect: { powerMultiplier: 3.0 }
      },
      {
        position: { x: 1, y: 1 },
        type: 'teleport',
        effect: { teleportTo: { x: 6, y: 3 } }
      }
    ],
    difficulty: 'hard',
    createdAt: new Date()
  },
  {
    name: 'Celestial Dimension',
    image: '/maps/celestial-dimension.png',
    themeColor: '#FFD700',
    gridSize: {
      width: 9,
      height: 6
    },
    specialSquares: [
      {
        position: { x: 4, y: 3 },
        type: 'ultimate',
        effect: { powerMultiplier: 5.0, healPerTurn: 5 }
      },
      {
        position: { x: 2, y: 1 },
        type: 'power',
        effect: { powerMultiplier: 2.0 }
      },
      {
        position: { x: 6, y: 4 },
        type: 'power',
        effect: { powerMultiplier: 2.0 }
      },
      {
        position: { x: 1, y: 2 },
        type: 'shield',
        effect: { damageReduction: 0.5 }
      },
      {
        position: { x: 7, y: 3 },
        type: 'shield',
        effect: { damageReduction: 0.5 }
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

// Note: In production, use proper Argon2 hashing via your API
// This is just a placeholder hash
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
    { cardId: insertedCards.insertedIds['0'], quantity: 3, acquiredAt: new Date() },
    { cardId: insertedCards.insertedIds['1'], quantity: 2, acquiredAt: new Date() },
    { cardId: insertedCards.insertedIds['2'], quantity: 1, acquiredAt: new Date() },
    { cardId: insertedCards.insertedIds['3'], quantity: 2, acquiredAt: new Date() }
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
    { cardId: insertedCards.insertedIds['0'], position: 0 },
    { cardId: insertedCards.insertedIds['1'], position: 1 },
    { cardId: insertedCards.insertedIds['2'], position: 2 },
    { cardId: insertedCards.insertedIds['3'], position: 3 }
  ],
  characterId: insertedCharacters.insertedIds['0'],
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
print('========================================');
print(`Characters: ${insertedCharacters.insertedIds.length}`);
print(`Cards: ${insertedCards.insertedIds.length}`);
print(`Maps: ${insertedMaps.insertedIds.length}`);
print(`Test Users: 1`);
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
print('Database is ready for use!');
print('========================================\n');