// MongoDB Seed Data Script - Queen's Blood Style Game (50 Cards Edition)
// Run this after initializing the schema
// mongosh <connection-string> < mongodb-seed-data-queens-blood.js

const dbName = 'board_game_db';
use(dbName);

print('Starting seed data insertion for Queen\'s Blood style game (50 cards edition)...\n');

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
  },
  {
    name: 'Fortress Warden',
    characterPic: '/characters/fortress-warden.png',
    rarity: 'rare',
    description: 'A defensive specialist who protects your positions',
    abilities: {
      skillName: 'Defensive Stance',
      skillDescription: 'Your cards adjacent to enemy cards gain +2 power',
      abilityType: 'continuous',
      effects: [
        {
          effectType: 'cardPowerBoost',
          value: 2,
          condition: 'adjacent to enemy card',
          target: 'your cards'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Elemental Sage',
    characterPic: '/characters/elemental-sage.png',
    rarity: 'epic',
    description: 'Master of elements who enhances card diversity',
    abilities: {
      skillName: 'Elemental Mastery',
      skillDescription: 'When you have all three card types on board, all gain +1 power',
      abilityType: 'triggered',
      effects: [
        {
          effectType: 'cardPowerBoost',
          value: 1,
          condition: 'all card types on board',
          target: 'all your cards'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'aerith gainsborough',
    characterPic: '/characters/aerith gainsborough.png',
    rarity: 'legendary',
    description: 'A flower peddler living in the Sector 5 slums, Aerith has been under Shinra surveillance all her life because of her unique background. Capable of sensing the planet\'s life force, she offers magical support to her comrades.',
    abilities: {
      skillName: 'Arcane Ward',
      skillDescription: 'Automatic started with 3 pawn row',
      abilityType: 'start_game',
      effects: [
        {
          effectType: 'addPawn',
          value: 2,
          condition: 'non',
          target: 'User Board'
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
// SEED 50 CARDS (Queen's Blood Mechanics)
// Distribution: 20 standard, 15 buff, 15 debuff
// ========================================
print('Inserting 50 cards with Queen\'s Blood mechanics...');

const cards = [
  // ========================================
  // STANDARD CARDS (20 cards - No Ability)
  // ========================================
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
    name: 'Side Step',
    power: 2,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Adds a pawn to the right square',
    cardImage: '/cards/side-step.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Backward Defense',
    power: 2,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Adds a pawn to the square below',
    cardImage: '/cards/backward-defense.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Diagonal Strike',
    power: 3,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Adds pawns diagonally forward',
    cardImage: '/cards/diagonal-strike.png',
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
    name: 'T-Formation',
    power: 4,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'T-shaped pawn placement. Requires 2 pawns.',
    cardImage: '/cards/t-formation.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'L-Shape Assault',
    power: 3,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'L-shaped pawn placement. Requires 2 pawns.',
    cardImage: '/cards/l-shape-assault.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'V-Formation',
    power: 4,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: 2, pawnCount: 1 }
    ],
    cardInfo: 'V-shaped forward advance. Requires 2 pawns.',
    cardImage: '/cards/v-formation.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Double Line',
    power: 3,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: 2, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Extends pawns horizontally. Requires 2 pawns.',
    cardImage: '/cards/double-line.png',
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
    name: 'Star Burst',
    power: 5,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Star pattern pawn placement. Requires 3 pawns.',
    cardImage: '/cards/star-burst.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Diamond Formation',
    power: 6,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Perfect diamond pattern. Requires 3 pawns.',
    cardImage: '/cards/diamond-formation.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Arrow Head',
    power: 5,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Arrow-shaped forward push. Requires 3 pawns.',
    cardImage: '/cards/arrow-head.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Wide Sweep',
    power: 5,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: 2, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Wide horizontal spread. Requires 3 pawns.',
    cardImage: '/cards/wide-sweep.png',
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
  {
    name: 'Supreme Command',
    power: 7,
    rarity: 'legendary',
    cardType: 'standard',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 2, relativeY: 0, pawnCount: 1 },
      { relativeX: -2, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Complete horizontal dominance. Requires 4 pawns.',
    cardImage: '/cards/supreme-command.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Galaxy Expansion',
    power: 8,
    rarity: 'legendary',
    cardType: 'standard',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: -1, pawnCount: 1 },
      { relativeX: -1, relativeY: -1, pawnCount: 1 },
      { relativeX: 0, relativeY: 2, pawnCount: 1 }
    ],
    cardInfo: 'Explosive diagonal spread. Requires 4 pawns.',
    cardImage: '/cards/galaxy-expansion.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Titan Wall',
    power: 7,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 1, relativeY: -1, pawnCount: 1 },
      { relativeX: -1, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Defensive wall formation. Requires 4 pawns.',
    cardImage: '/cards/titan-wall.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Perfect Circle',
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
      { relativeX: -1, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: -1, pawnCount: 1 },
      { relativeX: -1, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Complete surrounding pattern. Requires 4 pawns.',
    cardImage: '/cards/perfect-circle.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // ========================================
  // BUFF CARDS (15 cards - Increase Scores)
  // ========================================
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
    name: 'Courage Aura',
    power: 2,
    rarity: 'common',
    cardType: 'buff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases score of forward square by +2',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 2
    },
    cardInfo: 'Forward buff support',
    cardImage: '/cards/courage-aura.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Power Surge',
    power: 2,
    rarity: 'common',
    cardType: 'buff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases score of left square by +2',
      abilityLocations: [
        { relativeX: -1, relativeY: 0 }
      ],
      effectType: 'scoreBoost',
      effectValue: 2
    },
    cardInfo: 'Left side power boost',
    cardImage: '/cards/power-surge.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Dual Blessing',
    power: 2,
    rarity: 'rare',
    cardType: 'buff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases score of both adjacent squares by +2',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 }
      ],
      effectType: 'scoreBoost',
      effectValue: 2
    },
    cardInfo: 'Double-sided buff',
    cardImage: '/cards/dual-blessing.png',
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
    name: 'Honor Guard',
    power: 3,
    rarity: 'rare',
    cardType: 'buff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases diagonal squares by +3',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 3
    },
    cardInfo: 'Diagonal buff pattern. Requires 2 pawns.',
    cardImage: '/cards/honor-guard.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Strategic Boost',
    power: 3,
    rarity: 'rare',
    cardType: 'buff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts forward squares by +3',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 3
    },
    cardInfo: 'Wide forward buff. Requires 2 pawns.',
    cardImage: '/cards/strategic-boost.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Radiant Light',
    power: 3,
    rarity: 'epic',
    cardType: 'buff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Multiplies adjacent squares by 1.3x',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 }
      ],
      effectType: 'multiplier',
      effectValue: 1.3
    },
    cardInfo: 'Score multiplier buff. Requires 2 pawns.',
    cardImage: '/cards/radiant-light.png',
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
    cardInfo: 'Powerful score multiplier. Requires 3 pawns.',
    cardImage: '/cards/divine-blessing.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Champion Cry',
    power: 4,
    rarity: 'epic',
    cardType: 'buff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases score in L-pattern by +4',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 4
    },
    cardInfo: 'L-shaped buff. Requires 3 pawns.',
    cardImage: '/cards/champion-cry.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Battle Hymn',
    power: 4,
    rarity: 'epic',
    cardType: 'buff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases entire forward row by +4',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 },
        { relativeX: 2, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 4
    },
    cardInfo: 'Row-wide buff. Requires 3 pawns.',
    cardImage: '/cards/battle-hymn.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Celestial Harmony',
    power: 5,
    rarity: 'legendary',
    cardType: 'buff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Multiplies all surrounding squares by 2x',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: -1 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 }
      ],
      effectType: 'multiplier',
      effectValue: 2.0
    },
    cardInfo: 'Ultimate multiplier buff. Requires 4 pawns.',
    cardImage: '/cards/celestial-harmony.png',
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
    cardInfo: 'Ultimate row buff. Requires 4 pawns.',
    cardImage: '/cards/royal-decree.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Eternal Glory',
    power: 5,
    rarity: 'legendary',
    cardType: 'buff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases all forward squares by +6',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 },
        { relativeX: 0, relativeY: 2 }
      ],
      effectType: 'scoreBoost',
      effectValue: 6
    },
    cardInfo: 'Massive forward buff. Requires 4 pawns.',
    cardImage: '/cards/eternal-glory.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Omega Amplifier',
    power: 5,
    rarity: 'legendary',
    cardType: 'buff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Triples score of cross pattern',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: -1 }
      ],
      effectType: 'multiplier',
      effectValue: 3.0
    },
    cardInfo: 'Ultimate cross multiplier. Requires 4 pawns.',
    cardImage: '/cards/omega-amplifier.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // ========================================
  // DEBUFF CARDS (15 cards - Decrease Scores)
  // ========================================
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
    name: 'Weakening Touch',
    power: 2,
    rarity: 'common',
    cardType: 'debuff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces forward enemy square by -2',
      abilityLocations: [
        { relativeX: 0, relativeY: 2 }
      ],
      effectType: 'scoreReduction',
      effectValue: -2
    },
    cardInfo: 'Forward debuff',
    cardImage: '/cards/weakening-touch.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Poison Dart',
    power: 2,
    rarity: 'common',
    cardType: 'debuff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces enemy score by -2',
      abilityLocations: [
        { relativeX: -2, relativeY: 0 }
      ],
      effectType: 'scoreReduction',
      effectValue: -2
    },
    cardInfo: 'Left-side debuff',
    cardImage: '/cards/poison-dart.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Decay Aura',
    power: 2,
    rarity: 'rare',
    cardType: 'debuff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces two enemy squares by -2',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: 2, relativeY: 0 }
      ],
      effectType: 'scoreReduction',
      effectValue: -2
    },
    cardInfo: 'Double debuff',
    cardImage: '/cards/decay-aura.png',
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
    name: 'Corruption Spread',
    power: 3,
    rarity: 'rare',
    cardType: 'debuff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces horizontal enemy line by -3',
      abilityLocations: [
        { relativeX: 2, relativeY: 0 },
        { relativeX: -2, relativeY: 0 }
      ],
      effectType: 'scoreReduction',
      effectValue: -3
    },
    cardInfo: 'Horizontal debuff. Requires 2 pawns.',
    cardImage: '/cards/corruption-spread.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Hex Circle',
    power: 3,
    rarity: 'rare',
    cardType: 'debuff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces surrounding enemy squares by -3',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 },
        { relativeX: 0, relativeY: 2 }
      ],
      effectType: 'scoreReduction',
      effectValue: -3
    },
    cardInfo: 'Area debuff. Requires 2 pawns.',
    cardImage: '/cards/hex-circle.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Dark Shroud',
    power: 3,
    rarity: 'epic',
    cardType: 'debuff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces enemy scores by 30%',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: 2, relativeY: 0 }
      ],
      effectType: 'multiplier',
      effectValue: 0.7
    },
    cardInfo: 'Percentage debuff. Requires 2 pawns.',
    cardImage: '/cards/dark-shroud.png',
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
    name: 'Soul Drain',
    power: 4,
    rarity: 'epic',
    cardType: 'debuff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces forward area by -4',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 },
        { relativeX: 0, relativeY: 2 }
      ],
      effectType: 'scoreReduction',
      effectValue: -4
    },
    cardInfo: 'Forward area debuff. Requires 3 pawns.',
    cardImage: '/cards/soul-drain.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Nightmare Zone',
    power: 4,
    rarity: 'epic',
    cardType: 'debuff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces enemy diagonal squares by -5',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: 2, relativeY: 1 },
        { relativeX: 1, relativeY: 2 }
      ],
      effectType: 'scoreReduction',
      effectValue: -5
    },
    cardInfo: 'Diagonal debuff pattern. Requires 3 pawns.',
    cardImage: '/cards/nightmare-zone.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Void Touch',
    power: 4,
    rarity: 'legendary',
    cardType: 'debuff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Halves all adjacent enemy scores',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 }
      ],
      effectType: 'multiplier',
      effectValue: 0.5
    },
    cardInfo: 'Powerful area percentage debuff. Requires 3 pawns.',
    cardImage: '/cards/void-touch.png',
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
  },
  {
    name: 'Oblivion Wave',
    power: 5,
    rarity: 'legendary',
    cardType: 'debuff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces entire enemy row by -6',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 },
        { relativeX: 2, relativeY: 1 },
        { relativeX: -2, relativeY: 1 },
        { relativeX: 0, relativeY: 1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -6
    },
    cardInfo: 'Ultimate row debuff. Requires 4 pawns.',
    cardImage: '/cards/oblivion-wave.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Apocalypse',
    power: 5,
    rarity: 'legendary',
    cardType: 'debuff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces all enemy squares by 40%',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: -1 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 },
        { relativeX: 2, relativeY: 0 },
        { relativeX: -2, relativeY: 0 }
      ],
      effectType: 'multiplier',
      effectValue: 0.6
    },
    cardInfo: 'Massive area debuff. Requires 4 pawns.',
    cardImage: '/cards/apocalypse.png',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const insertedCards = db.cards.insertMany(cards);
const standardCount = cards.filter(c => c.cardType === 'standard').length;
const buffCount = cards.filter(c => c.cardType === 'buff').length;
const debuffCount = cards.filter(c => c.cardType === 'debuff').length;

print(`✓ Inserted ${insertedCards.insertedIds.length} cards:`);
print(`  - Standard (no ability): ${standardCount}`);
print(`  - Buff (increase score): ${buffCount}`);
print(`  - Debuff (decrease score): ${debuffCount}`);

// ========================================
// SEED MAPS - FIXED VERSION
// ========================================
print('Inserting maps...');

const maps = [
  {
    name: 'Starter Arena',
    image: '/maps/starter-arena.png',
    themeColor: '#4CAF50',
    gridSize: {
      width: 9,  // Changed from 10 to 9 (max allowed by schema)
      height: 3
    },
    specialSquares: [
      {
        position: { x: 4, y: 1 },  // Adjusted x from 5 to 4 (center of 9-width grid)
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      }
    ],
    difficulty: 'easy',
    createdAt: new Date()
    // Removed updatedAt since schema has updatedAt: false
  },
  {
    name: 'Tactical Battlefield',
    image: '/maps/tactical-battlefield.png',
    themeColor: '#FF5722',
    gridSize: {
      width: 9,  // Changed from 10 to 9
      height: 3
    },
    specialSquares: [
      {
        position: { x: 2, y: 1 },
        type: 'bonus',
        effect: { scoreBonus: 3 }
      },
      {
        position: { x: 6, y: 1 },  // Adjusted from 7 to 6
        type: 'bonus',
        effect: { scoreBonus: 3 }
      },
      {
        position: { x: 4, y: 1 },  // Adjusted from 5 to 4
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
      width: 9,  // Changed from 10 to 9
      height: 3
    },
    specialSquares: [
      {
        position: { x: 3, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 5, y: 1 },  // Adjusted from 6 to 5
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 4, y: 1 },  // Adjusted from 5 to 4
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
      width: 9,  // Changed from 10 to 9
      height: 5
    },
    specialSquares: [
      {
        position: { x: 4, y: 2 },  // Adjusted from 5 to 4 (center)
        type: 'special',
        effect: { scoreMultiplier: 3.0 }
      },
      {
        position: { x: 2, y: 1 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 6, y: 1 },  // Adjusted from 7 to 6
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 2, y: 3 },
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      },
      {
        position: { x: 6, y: 3 },  // Adjusted from 7 to 6
        type: 'multiplier',
        effect: { scoreMultiplier: 1.5 }
      }
    ],
    difficulty: 'expert',
    createdAt: new Date()
  }
];

try {
  const insertedMaps = db.maps.insertMany(maps);
  print(`✓ Inserted ${Object.keys(insertedMaps.insertedIds).length} maps`);
  
  // Verify insertion
  const mapCount = db.maps.countDocuments();
  print(`Total maps in database: ${mapCount}`);
} catch (error) {
  print(`✗ Error inserting maps: ${error.message}`);
  print(`Error details: ${JSON.stringify(error, null, 2)}`);
}
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

// Create inventory for test user with variety of cards
const testInventory = {
  userId: insertedUser.insertedId,
  cards: [
    // Standard cards
    { cardId: insertedCards.insertedIds['0'], quantity: 3, acquiredAt: new Date() }, // Basic Pawn
    { cardId: insertedCards.insertedIds['1'], quantity: 3, acquiredAt: new Date() }, // Forward Push
    { cardId: insertedCards.insertedIds['2'], quantity: 2, acquiredAt: new Date() }, // Side Step
    { cardId: insertedCards.insertedIds['5'], quantity: 2, acquiredAt: new Date() }, // Cross Formation
    { cardId: insertedCards.insertedIds['10'], quantity: 1, acquiredAt: new Date() }, // Mighty Fortress
    // Buff cards
    { cardId: insertedCards.insertedIds['20'], quantity: 2, acquiredAt: new Date() }, // Inspiring Presence
    { cardId: insertedCards.insertedIds['21'], quantity: 2, acquiredAt: new Date() }, // Courage Aura
    { cardId: insertedCards.insertedIds['24'], quantity: 1, acquiredAt: new Date() }, // Rally Banner
    // Debuff cards
    { cardId: insertedCards.insertedIds['35'], quantity: 2, acquiredAt: new Date() }, // Shadow Strike
    { cardId: insertedCards.insertedIds['38'], quantity: 1, acquiredAt: new Date() }  // Decay Aura
  ],
  characters: [
    { characterId: insertedCharacters.insertedIds['0'], acquiredAt: new Date() }, // Strategist Knight
    { characterId: insertedCharacters.insertedIds['1'], acquiredAt: new Date() }, // Shadow Tactician
    { characterId: insertedCharacters.insertedIds['4'], acquiredAt: new Date() }  // Swift Striker
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
  deckTitle: 'Balanced Starter Deck',
  userId: insertedUser.insertedId,
  cards: [
    { cardId: insertedCards.insertedIds['0'], position: 0 },  // Basic Pawn
    { cardId: insertedCards.insertedIds['0'], position: 1 },  // Basic Pawn
    { cardId: insertedCards.insertedIds['0'], position: 2 },  // Basic Pawn
    { cardId: insertedCards.insertedIds['1'], position: 3 },  // Forward Push
    { cardId: insertedCards.insertedIds['1'], position: 4 },  // Forward Push
    { cardId: insertedCards.insertedIds['20'], position: 5 }, // Inspiring Presence
    { cardId: insertedCards.insertedIds['20'], position: 6 }, // Inspiring Presence
    { cardId: insertedCards.insertedIds['5'], position: 7 },  // Cross Formation
    { cardId: insertedCards.insertedIds['35'], position: 8 }, // Shadow Strike
    { cardId: insertedCards.insertedIds['35'], position: 9 }  // Shadow Strike
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

db.decks.insertOne(testDeck);
print(`✓ Created balanced starter deck for test user`);

// ========================================
// PRINT SUMMARY
// ========================================
print('\n========================================');
print('Seed Data Insertion Complete!');
print('Queen\'s Blood Style Game Database - 50 Cards Edition');
print('========================================');
print(`Characters: ${insertedCharacters.insertedIds.length} (passive abilities only)`);
print(`Cards: ${insertedCards.insertedIds.length} total`);
print(`  - Standard (no ability): ${standardCount} cards`);
print(`  - Buff (increase score): ${buffCount} cards`);
print(`  - Debuff (decrease score): ${debuffCount} cards`);
print(`Maps: ${insertedMaps.insertedIds.length}`);
print(`Test Users: 1`);
print('========================================');
print('\nCard Distribution by Pawn Requirement:');
print(`  Requirement 1: ${cards.filter(c => c.pawnRequirement === 1).length} cards`);
print(`  Requirement 2: ${cards.filter(c => c.pawnRequirement === 2).length} cards`);
print(`  Requirement 3: ${cards.filter(c => c.pawnRequirement === 3).length} cards`);
print(`  Requirement 4: ${cards.filter(c => c.pawnRequirement === 4).length} cards`);
print('========================================');
print('\nRarity Distribution:');
print(`  Common: ${cards.filter(c => c.rarity === 'common').length} cards`);
print(`  Rare: ${cards.filter(c => c.rarity === 'rare').length} cards`);
print(`  Epic: ${cards.filter(c => c.rarity === 'epic').length} cards`);
print(`  Legendary: ${cards.filter(c => c.rarity === 'legendary').length} cards`);
print('========================================');
print('\nTest User Credentials:');
print('Username: testplayer');
print('Email: test@example.com');
print('Deck: 10 cards (balanced mix)');
print('Note: Password needs to be set via API with proper Argon2 hashing');
print('========================================\n');
print('\n========================================');
print('Game Design Notes:');
print('  • Start with 1 pawn on board');
print('  • Place cards to add more pawns');
print('  • Card placement requires matching pawn count');
print('  • Score calculated from cards, not characters');
print('  • Active games run in Redis');
print('  • Completed games stored in MongoDB');
print('========================================');

// Show collection counts
print('\nCollection Document Counts:');
print(`  users: ${db.users.countDocuments()}`);
print(`  characters: ${db.characters.countDocuments()}`);
print(`  cards: ${db.cards.countDocuments()}`);
print(`  maps: ${db.maps.countDocuments()}`);
print(`  inventories: ${db.inventories.countDocuments()}`);
print(`  decks: ${db.decks.countDocuments()}`);
print('\n========================================');
print('Database is ready for your Queen\'s Blood game!');
print('========================================\n');