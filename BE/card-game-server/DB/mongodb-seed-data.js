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
      abilityType: 'passive',
      effects: [
        {
          effectType: 'pawnBoost',
          value: 2,
          condition: 'start of game',
          target: 'User Board'
        },
        {
          effectType: 'debuffReduction',
          value: 0.75,
          condition: 'every time when debuff applied',
          target: 'User Board'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'sephiroth',
    characterPic: '/characters/sephiroth.png',
    rarity: 'legendary',
    description: 'There was one SOLDIER named Sephiroth, who was better than the rest, but when he found out about the terrible experiments that made him, he began to hate Shinra. And then, over time, he began to hate everything.',
    abilities: {
      skillName: 'Octaslash',
      skillDescription: 'Sephiroth Octaslash allows players to accumulate enemy pawns instead of replacing them when placing cards.',
      abilityType: 'triggered',
      effects: [
        {
          effectType: 'specialCondition',
          value: 0,
          condition: 'when place card(added pawn)',
          target: 'User Board'
        },
        {
          effectType: 'debuffCardPower',
          value: 1,
          condition: '(- 1) power for enemy card entire board',
          target: 'enemy Board'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Tifa Lockhart',
    characterPic: '/characters/Tifa Lockhart.png',
    rarity: 'legendary',
    description: 'A member of the anti-Shinra militant group Avalanche. Tifa manages Seventh Heaven, a bar located in the Sector 7 slums. A student of Zangan-style martial arts, she can clobber opponents with her fleet-footed combat techniques.',
    abilities: {
      skillName: 'Somersault',
      skillDescription: 'replace the enemy pawn using our pawn and enemy pawn',
      abilityType: 'triggered',
      effects: [
        {
          effectType: 'scoreMultiplier',
          value: 2,
          condition: 'if sum of scores in a row is more than 5, that row score will be multiplied by 2',
          target: 'User Board'
        }
      ]
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }, 
  {
    name: 'cloud strife',
    characterPic: '/characters/cloud strife.png',
    rarity: 'epic',
    description: 'Former First Class SOLDIER. After defecting from Shinra, Cloud began work as a mercenary for hire in Midgar. With his trusty broadsword in hand, he always gets the job done.',
    abilities: {
      skillName: 'Omnislash',
      skillDescription: 'buff/debuff only card in center row(row2) this will effected only our card and debuff will effect other player ',
      abilityType: 'passive',
      effects: [
        {
          effectType: 'cardPowerBoost',
          value: 2,
          condition: 'plus 2 power to card that place on row2(center row)',
          target: 'User Board'
        },
        {
          effectType: 'debuffCardPower',
          value: 2,
          condition: '(- 2) power for enemy card that place on row 2(center row)',
          target: 'enemy Board'
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
  // =======================================
  {
    name: 'Midgar Advance',
    power: 3,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Simple forward and side pressure formation',
    cardImage: '/cards/midgar-advance.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Sector Sweep',
    power: 3,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Basic cross-style area control',
    cardImage: '/cards/sector-sweep.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Reactor March',
    power: 3,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: 2, pawnCount: 1 }
    ],
    cardInfo: 'Straight forward advancement',
    cardImage: '/cards/reactor-march.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Shinra Formation',
    power: 4,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Standard horizontal deployment',
    cardImage: '/cards/shinra-formation.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Avalanche Strike',
    power: 4,
    rarity: 'common',
    cardType: 'standard',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: 2, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Aggressive forward push by Avalanche',
    cardImage: '/cards/avalanche-strike.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'SOLDIER Tactics',
    power: 5,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Balanced tactical formation. Requires 2 pawns',
    cardImage: '/cards/soldier-tactics.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Materia Surge',
    power: 5,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Diagonal forward spread. Requires 2 pawns',
    cardImage: '/cards/materia-surge.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Turks Encirclement',
    power: 5,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Controlled surrounding maneuver. Requires 2 pawns',
    cardImage: '/cards/turks-encirclement.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Mako Channeling',
    power: 5,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Board expansion focused around the center. Requires 2 pawns',
    cardImage: '/cards/mako-channeling.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Limit Drive',
    power: 6,
    rarity: 'rare',
    cardType: 'standard',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Powerful forward burst. Requires 2 pawns',
    cardImage: '/cards/limit-drive.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Buster Blade Path',
    power: 6,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: 2, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    cardInfo: 'Long straight forward path. Requires 3 pawns',
    cardImage: '/cards/buster-blade-path.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Highwind Maneuver',
    power: 6,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 2, relativeY: 1, pawnCount: 1 },
      { relativeX: -2, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Wide forward diagonal assault. Requires 3 pawns',
    cardImage: '/cards/highwind-maneuver.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Cosmo Canyon Guard',
    power: 7,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Defensive rear-focused formation. Requires 3 pawns',
    cardImage: '/cards/cosmo-canyon-guard.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Gold Saucer Rush',
    power: 7,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 2, relativeY: 0, pawnCount: 1 },
      { relativeX: -2, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Wide horizontal expansion. Requires 3 pawns',
    cardImage: '/cards/gold-saucer-rush.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Ancient Guardian Sigil',
    power: 7,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    cardInfo: 'Protective diagonal formation. Requires 3 pawns',
    cardImage: '/cards/ancient-guardian-sigil.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Weapon Awakening',
    power: 7,
    rarity: 'epic',
    cardType: 'standard',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 2, relativeY: 1, pawnCount: 1 },
      { relativeX: -2, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Large-scale forward spread. Requires 3 pawns',
    cardImage: '/cards/weapon-awakening.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Jenova Pulse',
    power: 8,
    rarity: 'legendary',
    cardType: 'standard',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 },
      { relativeX: 2, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Unpredictable forward expansion. Requires 4 pawns',
    cardImage: '/cards/jenova-pulse.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Meteor Descent',
    power: 9,
    rarity: 'legendary',
    cardType: 'standard',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: -1, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Heavy central impact formation. Requires 4 pawns',
    cardImage: '/cards/meteor-descent.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'One-Winged Dominion',
    power: 10,
    rarity: 'legendary',
    cardType: 'standard',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: 1, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: -1, pawnCount: 1 },
      { relativeX: 2, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Overwhelming forward dominance. Requires 4 pawns',
    cardImage: '/cards/one-winged-dominion.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Lifestream Convergence',
    power: 10,
    rarity: 'legendary',
    cardType: 'standard',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 },
      { relativeX: 2, relativeY: 0, pawnCount: 1 }
    ],
    cardInfo: 'Complete area convergence. Requires 4 pawns',
    cardImage: '/cards/lifestream-convergence.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // ========================================
  // BUFF CARDS (15 cards - Increase Scores)
  // ========================================
  {
    name: 'Shinra Command',
    power: 2,
    rarity: 'common',
    cardType: 'buff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases score of adjacent squares by +2',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 }
      ],
      effectType: 'scoreBoost',
      effectValue: 2
    },
    cardInfo: 'Basic adjacent buff support',
    cardImage: '/cards/shinra-command.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Midgar Rally',
    power: 2,
    rarity: 'common',
    cardType: 'buff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts forward adjacent squares by +2',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 2
    },
    cardInfo: 'Forward support buff',
    cardImage: '/cards/midgar-rally.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Avalanche Support',
    power: 2,
    rarity: 'common',
    cardType: 'buff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Increases score of forward-left square by +2',
      abilityLocations: [
        { relativeX: -1, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 2
    },
    cardInfo: 'Directional support buff',
    cardImage: '/cards/avalanche-support.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Materia Focus',
    power: 3,
    rarity: 'rare',
    cardType: 'buff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts diagonal squares by +3',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 3
    },
    cardInfo: 'Focused diagonal buff. Requires 2 pawns.',
    cardImage: '/cards/materia-focus.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Turks Coordination',
    power: 3,
    rarity: 'rare',
    cardType: 'buff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts surrounding squares by +3',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 3
    },
    cardInfo: 'Compact control buff. Requires 2 pawns.',
    cardImage: '/cards/turks-coordination.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Limit Charge',
    power: 3,
    rarity: 'rare',
    cardType: 'buff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts forward row by +3',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 3
    },
    cardInfo: 'Forward row buff. Requires 2 pawns.',
    cardImage: '/cards/limit-charge.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Planetary Blessing',
    power: 4,
    rarity: 'epic',
    cardType: 'buff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Multiplies adjacent squares by 1.4x',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 }
      ],
      effectType: 'multiplier',
      effectValue: 1.4
    },
    cardInfo: 'Balanced multiplier buff. Requires 3 pawns.',
    cardImage: '/cards/planetary-blessing.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Cosmo Insight',
    power: 4,
    rarity: 'epic',
    cardType: 'buff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts rear and side squares by +4',
      abilityLocations: [
        { relativeX: 0, relativeY: -1 },
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 }
      ],
      effectType: 'scoreBoost',
      effectValue: 4
    },
    cardInfo: 'Rear-focused buff. Requires 3 pawns.',
    cardImage: '/cards/cosmo-insight.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Highwind Support',
    power: 4,
    rarity: 'epic',
    cardType: 'buff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: 2, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts distant forward squares by +4',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 0 }
      ],
      effectType: 'scoreBoost',
      effectValue: 4
    },
    cardInfo: 'Long-range forward buff. Requires 3 pawns.',
    cardImage: '/cards/highwind-support.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Ancient Resonance',
    power: 4,
    rarity: 'epic',
    cardType: 'buff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Multiplies diagonal squares by 1.6x',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 }
      ],
      effectType: 'multiplier',
      effectValue: 1.6
    },
    cardInfo: 'Diagonal multiplier buff. Requires 3 pawns.',
    cardImage: '/cards/ancient-resonance.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Buster Sword Legacy',
    power: 5,
    rarity: 'legendary',
    cardType: 'buff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts cross-forward pattern by +5',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 }
      ],
      effectType: 'scoreBoost',
      effectValue: 5
    },
    cardInfo: 'Legacy of a SOLDIER. Powerful balanced buff. Requires 4 pawns.',
    cardImage: '/cards/buster-sword-legacy.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Meteor Alignment',
    power: 5,
    rarity: 'legendary',
    cardType: 'buff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts central forward area by +5',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: -1, relativeY: 1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 5
    },
    cardInfo: 'Central forward buff. Requires 4 pawns.',
    cardImage: '/cards/meteor-alignment.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Jenova Amplification',
    power: 5,
    rarity: 'legendary',
    cardType: 'buff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Multiplies surrounding squares by 2x',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: -1 }
      ],
      effectType: 'multiplier',
      effectValue: 2.0
    },
    cardInfo: 'Surrounding multiplier buff. Requires 4 pawns.',
    cardImage: '/cards/jenova-amplification.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Lifestream Echo',
    power: 5,
    rarity: 'legendary',
    cardType: 'buff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Boosts all adjacent squares by +6',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: -1 }
      ],
      effectType: 'scoreBoost',
      effectValue: 6
    },
    cardInfo: 'Massive adjacent buff. Requires 4 pawns.',
    cardImage: '/cards/lifestream-echo.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'One-Winged Amplify',
    power: 5,
    rarity: 'legendary',
    cardType: 'buff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Triples forward center square',
      abilityLocations: [
        { relativeX: 0, relativeY: 1 }
      ],
      effectType: 'multiplier',
      effectValue: 3.0
    },
    cardInfo: 'Extreme single-point buff. Requires 4 pawns.',
    cardImage: '/cards/one-winged-amplify.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // ========================================
  // DEBUFF CARDS (15 cards - Decrease Scores)
  // ========================================
  {
    name: 'Shinra Suppression',
    power: 2,
    rarity: 'common',
    cardType: 'debuff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces adjacent enemy score by -2',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -2
    },
    cardInfo: 'Basic Shinra pressure tactic',
    cardImage: '/cards/shinra-suppression.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Turks Interference',
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
        { relativeX: 2, relativeY: 0 }
      ],
      effectType: 'scoreReduction',
      effectValue: -2
    },
    cardInfo: 'Subtle forward disruption',
    cardImage: '/cards/turks-interference.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Materia Drain',
    power: 2,
    rarity: 'common',
    cardType: 'debuff',
    pawnRequirement: 1,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces enemy score by -2',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 }
      ],
      effectType: 'scoreReduction',
      effectValue: -2
    },
    cardInfo: 'Drains enemy power',
    cardImage: '/cards/materia-drain.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Mako Poisoning',
    power: 3,
    rarity: 'rare',
    cardType: 'debuff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces two enemy squares by -3',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 1, relativeY: 1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -3
    },
    cardInfo: 'Contaminated Mako effect',
    cardImage: '/cards/mako-poisoning.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Avalanche Sabotage',
    power: 3,
    rarity: 'rare',
    cardType: 'debuff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces forward row by -3',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: 1, relativeY: -1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -3
    },
    cardInfo: 'Explosive forward disruption',
    cardImage: '/cards/avalanche-sabotage.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Hojo Experiment',
    power: 3,
    rarity: 'rare',
    cardType: 'debuff',
    pawnRequirement: 2,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces diagonal enemy squares by -3',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: 1, relativeY: -1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -3
    },
    cardInfo: 'Unstable experimental debuff',
    cardImage: '/cards/hojo-experiment.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Midgar Lockdown',
    power: 4,
    rarity: 'epic',
    cardType: 'debuff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 },
    ],
    ability: {
      abilityDescription: 'Reduces enemy column by -4',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: 1, relativeY: -1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -4
    },
    cardInfo: 'Shinra enforces total city lockdown',
    cardImage: '/cards/midgar-lockdown.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Cosmo Fear',
    power: 4,
    rarity: 'epic',
    cardType: 'debuff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces surrounding enemy scores by -4',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 1, relativeY: -1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -4
    },
    cardInfo: 'Psychological debuff',
    cardImage: '/cards/cosmo-fear.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Jenova Corruption',
    power: 4,
    rarity: 'epic',
    cardType: 'debuff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces adjacent enemy scores by 30%',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 1, relativeY: 1 }
      ],
      effectType: 'multiplier',
      effectValue: 0.7
    },
    cardInfo: 'Mutagenic influence',
    cardImage: '/cards/jenova-corruption.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Black Materia Pulse',
    power: 4,
    rarity: 'epic',
    cardType: 'debuff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces forward area by -5',
      abilityLocations: [
        { relativeX: 1, relativeY: 1 },
        { relativeX: 1, relativeY: 0 },
        { relativeX: 1, relativeY: -1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -5
    },
    cardInfo: 'Dark materia shockwave',
    cardImage: '/cards/black-materia-pulse.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Meteor Omen',
    power: 4,
    rarity: 'epic',
    cardType: 'debuff',
    pawnRequirement: 3,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces distant enemy squares by -4',
      abilityLocations: [
        { relativeX: 2, relativeY: 0 }
      ],
      effectType: 'scoreReduction',
      effectValue: -4
    },
    cardInfo: 'Impending destruction',
    cardImage: '/cards/meteor-omen.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'One-Winged Terror',
    power: 5,
    rarity: 'legendary',
    cardType: 'debuff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 0, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Halves forward enemy score',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 }
      ],
      effectType: 'multiplier',
      effectValue: 0.5
    },
    cardInfo: 'Sephiroth’s overwhelming presence',
    cardImage: '/cards/one-winged-terror.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Lifestream Collapse',
    power: 5,
    rarity: 'legendary',
    cardType: 'debuff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 1, relativeY: 0, pawnCount: 1 },
      { relativeX: -1, relativeY: 0, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces all surrounding enemy scores by -6',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: -1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 1, relativeY: -1 }
      ],
      effectType: 'scoreReduction',
      effectValue: -6
    },
    cardInfo: 'Planetary destabilization',
    cardImage: '/cards/lifestream-collapse.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Shinra Extermination',
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
      abilityDescription: 'Reduces enemy row by 50%',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 1, relativeY: 1 },
        { relativeX: 1, relativeY: -1 }
      ],
      effectType: 'multiplier',
      effectValue: 0.5
    },
    cardInfo: 'Total suppression protocol',
    cardImage: '/cards/shinra-extermination.png',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Meteorfall',
    power: 5,
    rarity: 'legendary',
    cardType: 'debuff',
    pawnRequirement: 4,
    pawnLocations: [
      { relativeX: 0, relativeY: 1, pawnCount: 1 },
      { relativeX: 0, relativeY: -1, pawnCount: 1 }
    ],
    ability: {
      abilityDescription: 'Reduces cross-pattern enemy scores by 60%',
      abilityLocations: [
        { relativeX: 1, relativeY: 0 },
        { relativeX: 0, relativeY: 1 },
        { relativeX: 0, relativeY: -1 }
      ],
      effectType: 'multiplier',
      effectValue: 0.5
    },
    cardInfo: 'End of the world',
    cardImage: '/cards/meteorfall.png',
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
      width: 6,
      height: 3
    },
    specialSquares: [],
    difficulty: 'easy',
    createdAt: new Date()
  },
  {
    name: 'Tactical Battlefield',
    image: '/maps/tactical-battlefield.png',
    themeColor: '#FF5722',
    gridSize: {
      width: 6,
      height: 3
    },
    specialSquares: [],
    difficulty: 'medium',
    createdAt: new Date()
  },
  {
    name: 'Strategic Colosseum',
    image: '/maps/strategic-colosseum.png',
    themeColor: '#2196F3',
    gridSize: {
      width: 6,
      height: 3
    },
    specialSquares: [],
    difficulty: 'hard',
    createdAt: new Date()
  },
  {
    name: 'Grandmaster\'s Court',
    image: '/maps/grandmaster-court.png',
    themeColor: '#9C27B0',
    gridSize: {
      width: 6,
      height: 3
    },
    specialSquares: [],
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