// MongoDB Schema Initialization Script - Queen's Blood Style Game
// Run this script using: mongosh <connection-string> < mongodb-schema-init.js
// Game Concept: Chess + Card Game (like FF7 Rebirth Queen's Blood)
// - Characters provide passive abilities to help the owner
// - Cards are placed on board to add pawns and manipulate scores
// - Score is calculated from cards on the board
// - Redis handles active game state, MongoDB stores persistent data

const dbName = 'board_game_db';

// Connect to database
use(dbName);

print('Creating collections with validators for Queen\'s Blood style game...');
// ========================================
// 1. USERS COLLECTION
// ========================================
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password', 'displayName'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 20,
          description: 'Username must be between 3-20 characters'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Valid email address required'
        },
        password: {
          bsonType: 'string',
          description: 'Argon2 hashed password'
        },
        displayName: {
         bsonType: 'string',
         minLength: 2,
         maxLength: 30,
         description: 'Display name for in-game use'
        },
        coins: {
          bsonType: 'int',
          minimum: 0,
          description: 'In-game currency for gacha'
        },
        gachaPity: {
          bsonType: 'object',
          description: 'Pity counters for gacha system',
          properties: {
           totalPulls: { bsonType: 'int', minimum: 0 },
           pullsSinceLastEpic: { bsonType: 'int', minimum: 0 },
           pullsSinceLastLegendary: { bsonType: 'int', minimum: 0 }
          }
        },
        stats: {
          bsonType: 'object',
          properties: {
            winRate: { bsonType: 'number', minimum: 0, maximum: 100 },
            totalGames: { bsonType: 'int', minimum: 0 },
            wins: { bsonType: 'int', minimum: 0 },
            losses: { bsonType: 'int', minimum: 0 }
          }
        },
        gameHistory: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              gameId: { bsonType: 'objectId' },
              opponent: { bsonType: 'objectId' },
              result: { enum: ['win', 'loss', 'draw'] },
              playedAt: { bsonType: 'date' }
            }
          }
        },
        isOnline: {
          bsonType: 'bool',
          description: 'Online status'
        },
        lastLogin: {
          bsonType: 'date',
          description: 'Last login timestamp'
        },
        profilePic: {
          bsonType: 'string',
          description: 'Profile picture URL or path'
        },
        isEmailVerified: {
          bsonType: 'bool',
          description: 'Email verification status'
        },
        friends: {
          bsonType: 'array',
          items: { bsonType: 'objectId' },
          description: 'Array of friend user IDs'
        },
        inventory: {
          bsonType: 'objectId',
          description: 'Reference to inventory'
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

// Users Indexes
db.users.createIndex({ uid: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isOnline: 1 });
db.users.createIndex({ 'stats.winRate': -1 });
db.users.createIndex({ lastLogin: -1 });
db.users.createIndex({ createdAt: -1 });

print('✓ Users collection created');

// ========================================
// 2. EMAIL VERIFICATIONS COLLECTION
// ========================================
db.createCollection('emailVerifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['accountId', 'token', 'expiryDate'],
      properties: {
        accountId: {
          bsonType: 'objectId',
          description: 'Reference to user account'
        },
        token: {
          bsonType: 'string',
          description: 'Verification token'
        },
        expiryDate: {
          bsonType: 'date',
          description: 'Token expiration date'
        },
        isVerified: {
          bsonType: 'bool',
          description: 'Whether token has been used'
        },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.emailVerifications.createIndex({ token: 1 }, { unique: true });
db.emailVerifications.createIndex({ accountId: 1 });
db.emailVerifications.createIndex({ expiryDate: 1 }, { expireAfterSeconds: 0 }); // TTL index

print('✓ Email Verifications collection created');

// ========================================
// 3. PASSWORD RESETS COLLECTION
// ========================================
db.createCollection('passwordResets', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['accountId', 'token', 'expiryDate'],
      properties: {
        accountId: {
          bsonType: 'objectId',
          description: 'Reference to user account'
        },
        token: {
          bsonType: 'string',
          description: 'Reset token'
        },
        expiryDate: {
          bsonType: 'date',
          description: 'Token expiration date'
        },
        isUsed: {
          bsonType: 'bool',
          description: 'Whether token has been used'
        },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.passwordResets.createIndex({ token: 1 }, { unique: true });
db.passwordResets.createIndex({ accountId: 1 });
db.passwordResets.createIndex({ expiryDate: 1 }, { expireAfterSeconds: 0 }); // TTL index

print('✓ Password Resets collection created');

// ========================================
// 4. INVENTORIES COLLECTION
// ========================================
db.createCollection('inventories', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'Reference to user - required'
        },
        cards: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['cardId', 'quantity'],
            properties: {
              cardId: { bsonType: 'objectId' },
              quantity: { bsonType: 'int', minimum: 1 },
              acquiredAt: { bsonType: 'date' }
            }
          }
        },
        characters: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['characterId'],
            properties: {
              characterId: { bsonType: 'objectId' },
              acquiredAt: { bsonType: 'date' }
            }
          }
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.inventories.createIndex({ userId: 1 }, { unique: true });
db.inventories.createIndex({ 'cards.cardId': 1 });
db.inventories.createIndex({ 'characters.characterId': 1 });

print('✓ Inventories collection created');

// ========================================
// 5. DECKS COLLECTION
// ========================================
db.createCollection('decks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['deckTitle', 'userId'],
      properties: {
        deckTitle: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50,
          description: 'Deck title'
        },
        userId: {
          bsonType: 'objectId',
          description: 'Reference to owner'
        },
        cards: {
          bsonType: 'array',
          maxItems: 30, // Typical deck size limit
          items: {
            bsonType: 'object',
            required: ['cardId'],
            properties: {
              cardId: { bsonType: 'objectId' },
              position: { bsonType: 'int', minimum: 0 }
            }
          }
        },
        isActive: {
          bsonType: 'bool',
          description: 'Currently selected deck'
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.decks.createIndex({ userId: 1 });
db.decks.createIndex({ userId: 1, isActive: 1 });
db.decks.createIndex({ createdAt: -1 });

print('✓ Decks collection created');

// ========================================
// 6. CHARACTERS COLLECTION
// Updated for Queen's Blood gameplay
// Characters provide passive abilities to help the owner player
// No stats - score comes from cards on board
// ========================================
db.createCollection('characters', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'characterPic', 'rarity'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Character name'
        },
        characterPic: {
          bsonType: 'string',
          description: 'Character image URL'
        },
        rarity: {
          enum: ['common', 'rare', 'epic', 'legendary'],
          description: 'Character rarity'
        },
        description: {
          bsonType: 'string',
          description: 'Character lore and background'
        },
        abilities: {
          bsonType: 'object',
          description: 'Passive abilities that help the owner player',
          properties: {
            skillName: {
              bsonType: 'string',
              description: 'Name of the character ability'
            },
            skillDescription: {
              bsonType: 'string',
              description: 'Detailed description of what the ability does'
            },
            abilityType: {
              enum: ['passive', 'triggered', 'continuous'],
              description: 'When the ability activates'
            },
            effects: {
              bsonType: 'array',
              description: 'List of effects this character provides',
              items: {
                bsonType: 'object',
                properties: {
                  effectType: {
                    enum: ['pawnBoost', 'scoreMultiplier', 'cardPowerBoost', 'extraDraw', 'placementBonus', 'specialCondition'],
                    description: 'Type of effect'
                  },
                  value: {
                    bsonType: 'number',
                    description: 'Effect value (e.g., +2 score, x1.5 multiplier)'
                  },
                  condition: {
                    bsonType: 'string',
                    description: 'When this effect applies (e.g., "adjacent cards", "same row")'
                  },
                  target: {
                    bsonType: 'string',
                    description: 'What this effect targets (e.g., "all cards", "buff cards only")'
                  }
                }
              }
            }
          }
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.characters.createIndex({ name: 1 });
db.characters.createIndex({ rarity: 1 });

print('✓ Characters collection created (updated for passive abilities)');

// ========================================
// 7. CARDS COLLECTION
// Updated for Queen's Blood gameplay mechanics
// - Cards add pawns to board locations
// - Cards have pawn requirements (1-4)
// - Three types: standard, buff, debuff
// - Cards determine score on board
// ========================================
db.createCollection('cards', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'power', 'cardType', 'pawnRequirement'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Card name'
        },
        power: {
          bsonType: 'int',
          minimum: 1,
          description: 'Base power/score value of the card'
        },
        rarity: {
          enum: ['common', 'rare', 'epic', 'legendary'],
          description: 'Card rarity'
        },
        cardType: {
          enum: ['standard', 'buff', 'debuff'],
          description: 'Card type - standard (no ability), buff (increase square score), debuff (decrease square score)'
        },
        pawnRequirement: {
          bsonType: 'int',
          minimum: 1,
          maximum: 4,
          description: 'Number of pawns required in square to place this card (1-4)'
        },
        pawnLocations: {
          bsonType: 'array',
          description: 'Where pawns will be added when this card is played',
          items: {
            bsonType: 'object',
            required: ['relativeX', 'relativeY'],
            properties: {
              relativeX: {
                bsonType: 'int',
                description: 'X offset from placement square (-2 to +2)'
              },
              relativeY: {
                bsonType: 'int',
                description: 'Y offset from placement square (-2 to +2)'
              },
              pawnCount: {
                bsonType: 'int',
                minimum: 1,
                maximum: 1,
                description: 'Always 1 - adds 1 pawn to location'
              }
            }
          }
        },
        ability: {
          bsonType: 'object',
          description: 'Card ability (only for buff/debuff types)',
          properties: {
            abilityDescription: {
              bsonType: 'string',
              description: 'What the ability does'
            },
            abilityLocations: {
              bsonType: 'array',
              description: 'Which squares are affected by this card ability',
              items: {
                bsonType: 'object',
                required: ['relativeX', 'relativeY'],
                properties: {
                  relativeX: {
                    bsonType: 'int',
                    description: 'X offset from placement square'
                  },
                  relativeY: {
                    bsonType: 'int',
                    description: 'Y offset from placement square'
                  }
                }
              }
            },
            effectType: {
              enum: ['scoreBoost', 'scoreReduction', 'multiplier', 'conditional'],
              description: 'Type of effect'
            },
            effectValue: {
              bsonType: 'number',
              description: 'Value of effect (e.g., +3 score, x1.5 multiplier, -2 score)'
            },
            condition: {
              bsonType: 'string',
              description: 'Condition for ability to activate (if conditional)'
            }
          }
        },
        cardInfo: {
          bsonType: 'string',
          description: 'Card lore and detailed description'
        },
        cardImage: {
          bsonType: 'string',
          description: 'Card image URL'
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});

db.cards.createIndex({ name: 1 });
db.cards.createIndex({ rarity: 1 });
db.cards.createIndex({ cardType: 1 });
db.cards.createIndex({ power: -1 });
db.cards.createIndex({ pawnRequirement: 1 });

print('✓ Cards collection created (updated for Queen\'s Blood mechanics)');

// ========================================
// 8. FRIEND REQUESTS COLLECTION
// ========================================
db.createCollection('friendRequests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['fromUserId', 'toUserId', 'status'],
      properties: {
        fromUserId: {
          bsonType: 'objectId',
          description: 'User who sent the request'
        },
        toUserId: {
          bsonType: 'objectId',
          description: 'User who receives the request'
        },
        status: {
          enum: ['pending', 'accepted', 'rejected', 'cancelled'],
          description: 'Request status'
        },
        createdAt: { bsonType: 'date' },
        respondedAt: { bsonType: 'date' }
      }
    }
  }
});

db.friendRequests.createIndex({ fromUserId: 1, toUserId: 1 });
db.friendRequests.createIndex({ toUserId: 1, status: 1 });
db.friendRequests.createIndex({ status: 1 });
db.friendRequests.createIndex({ createdAt: -1 });

print('✓ Friend Requests collection created');

// ========================================
// 9. MAPS COLLECTION
// Board layouts for the game
// ========================================
db.createCollection('maps', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'image', 'gridSize'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Map name'
        },
        image: {
          bsonType: 'string',
          description: 'Map image URL'
        },
        themeColor: {
          bsonType: 'string',
          description: 'Theme color for UI'
        },
        gridSize: {
          bsonType: 'object',
          required: ['width', 'height'],
          properties: {
            width: { bsonType: 'int', minimum: 3, maximum: 9 },
            height: { bsonType: 'int', minimum: 3, maximum: 5 }
          }
        },
        specialSquares: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              position: {
                bsonType: 'object',
                required: ['x', 'y'],
                properties: {
                  x: { bsonType: 'int' },
                  y: { bsonType: 'int' }
                }
              },
              type: {
                enum: ['multiplier', 'bonus', 'restricted', 'special'],
                description: 'Type of special square'
              },
              effect: { bsonType: 'object' }
            }
          }
        },
        difficulty: {
          enum: ['easy', 'medium', 'hard', 'expert'],
          description: 'Map difficulty'
        },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.maps.createIndex({ name: 1 });
db.maps.createIndex({ difficulty: 1 });

print('✓ Maps collection created');

// ========================================
// 10. GAME LOBBIES COLLECTION
// Updated to match Mongoose Schema (Players Array + CharacterId)
// ========================================
db.createCollection('gameLobbies', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['hostUserId', 'mapId', 'lobbyName', 'status'],
      properties: {
        hostUserId: {
          bsonType: 'objectId',
          description: 'User who created the lobby'
        },
        hostDeckId: {
          bsonType: ['objectId', 'null'],
          description: 'Host selected deck'
        },
        hostCharacterId: {
          bsonType: ['objectId', 'null'],
          description: 'Host selected character'
        },
        players: {
          bsonType: 'array',
          description: 'List of players in the lobby',
          items: {
            bsonType: 'object',
            required: ['userId'],
            properties: {
              userId: { bsonType: 'objectId' },
              deckId: { bsonType: ['objectId', 'null'] },
              characterId: { bsonType: ['objectId', 'null'] },
              isReady: { bsonType: 'bool' },
              joinedAt: { bsonType: 'date' }
            }
          }
        },
        mapId: {
          bsonType: 'objectId',
          description: 'Selected map for the game'
        },
        lobbyName: {
          bsonType: 'string',
          maxLength: 50,
          description: 'Custom lobby name'
        },
        isPrivate: {
          bsonType: 'bool',
          description: 'Whether lobby requires password'
        },
        password: {
          bsonType: ['string', 'null'],
          description: 'Lobby password (if private)'
        },
        maxPlayers: {
          bsonType: 'int',
          minimum: 2,
          maximum: 2,
          description: 'Max players allowed'
        },
        status: {
          enum: ['waiting', 'ready', 'started', 'cancelled'],
          description: 'Lobby status'
        },
        gameId: {
          bsonType: ['objectId', 'null'],
          description: 'Reference to created game when started'
        },
        gameSettings: {
          bsonType: 'object',
          properties: {
            turnTimeLimit: { bsonType: 'int' },
            allowSpectators: { bsonType: 'bool' }
          }
        },
        createdAt: { bsonType: 'date' },
        startedAt: { bsonType: ['date', 'null'] },
        expiresAt: {
          bsonType: 'date',
          description: 'Auto-close lobby after this time'
        }
      }
    }
  }
});

// Updated Indexes to match Mongoose Schema
db.gameLobbies.createIndex({ status: 1, isPrivate: 1, createdAt: -1 });
db.gameLobbies.createIndex({ hostUserId: 1, status: 1 });
db.gameLobbies.createIndex({ 'players.userId': 1 }); // Allows searching for lobbies a user is in
db.gameLobbies.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

print('✓ Game Lobbies collection created (Synced with Mongoose Model)');

// ========================================
// 11. GAMES COLLECTION
// Store completed games (for history and stats)
// ========================================
db.createCollection('games', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['players', 'mapId', 'status'],
      properties: {
        lobbyId: {
          bsonType: 'objectId',
          description: 'Reference to lobby that started this game'
        },
        players: {
          bsonType: 'array',
          minItems: 2,
          maxItems: 2,
          items: {
            bsonType: 'object',
            required: ['userId', 'deckId', 'characterId', 'finalScore'],
            properties: {
              userId: { bsonType: 'objectId' },
              deckId: { bsonType: 'objectId' },
              characterId: { bsonType: 'objectId' }, // Ensured characterId is here too
              finalScore: { bsonType: 'int', minimum: 0 },
              cardsPlayed: { bsonType: 'int', minimum: 0 }
            }
          }
        },
        mapId: {
          bsonType: 'objectId',
          description: 'Reference to map used'
        },
        totalTurns: {
          bsonType: 'int',
          minimum: 0,
          description: 'Total number of turns played'
        },
        status: {
          enum: ['completed', 'abandoned', 'draw'],
          description: 'Game final status'
        },
        winner: {
          bsonType: ['objectId', 'null'],
          description: 'Winner user ID (null if draw)'
        },
        gameDuration: {
          bsonType: 'int',
          description: 'Game duration in seconds'
        },
        finalBoardState: {
          bsonType: 'object',
          description: 'Final board state (optional, for replay)'
        },
        createdAt: { bsonType: 'date' },
        startedAt: { bsonType: 'date' },
        completedAt: { bsonType: 'date' }
      }
    }
  }
});

db.games.createIndex({ status: 1 });
db.games.createIndex({ 'players.userId': 1 });
db.games.createIndex({ winner: 1 });
db.games.createIndex({ createdAt: -1 });
db.games.createIndex({ completedAt: -1 });

print('✓ Games collection created (for completed games)');

// ========================================
// 12. CHAT MESSAGES COLLECTION
// ========================================
db.createCollection('chatMessages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['gameId', 'userId', 'message', 'timestamp'],
      properties: {
        gameId: {
          bsonType: 'objectId',
          description: 'Reference to game or lobby'
        },
        userId: {
          bsonType: 'objectId',
          description: 'User who sent the message'
        },
        message: {
          bsonType: 'string',
          maxLength: 500,
          description: 'Chat message content'
        },
        messageType: {
          enum: ['text', 'emoji', 'system'],
          description: 'Type of message'
        },
        timestamp: {
          bsonType: 'date',
          description: 'When message was sent'
        }
      }
    }
  }
});

db.chatMessages.createIndex({ gameId: 1, timestamp: 1 });
db.chatMessages.createIndex({ userId: 1 });
db.chatMessages.createIndex({ timestamp: -1 });

print('✓ Chat Messages collection created');

// ========================================
// PRINT SUMMARY
// ========================================
print('\n========================================');
print('MongoDB Schema Creation Complete!');
print('Queen\'s Blood Style Game Database');
print('========================================');
print('Collections created:');
print('  1. users - Player accounts');
print('  2. emailVerifications - Email tokens');
print('  3. passwordResets - Password reset tokens');
print('  4. inventories - Player card & character collections');
print('  5. decks - Player deck configurations');
print('  6. characters - Characters with passive abilities (NO STATS)');
print('  7. cards - Cards with pawn requirements & abilities');
print('  8. friendRequests - Friend system');
print('  9. maps - Board layouts');
print(' 10. gameLobbies - Pre-game lobbies');
print(' 11. games - Completed game records');
print(' 12. chatMessages - In-game chat');
print('========================================');
print('\nGame Mechanics:');
print('  • Characters: Passive abilities only (no stats)');
print('  • Cards: 3 types (standard, buff, debuff)');
print('  • Pawn Requirements: 1-4 pawns needed to place card');
print('  • Score: Calculated from cards on board');
print('  • Active Games: Stored in Redis');
print('  • Completed Games: Stored in MongoDB');
print('========================================\n');

// List all indexes
print('Indexes created:');
const collections = [
  'users',
  'emailVerifications',
  'passwordResets',
  'inventories',
  'decks',
  'characters',
  'cards',
  'friendRequests',
  'maps',
  'gameLobbies',
  'games',
  'chatMessages'
];

collections.forEach(collectionName => {
  print(`\n${collectionName}:`);
  db[collectionName].getIndexes().forEach(index => {
    print(`  - ${JSON.stringify(index.key)}`);
  });
});

print('\n========================================');
print('Next steps:');
print('1. Insert seed data using the seed script');
print('2. Set up Redis for active game state');
print('3. Configure your application connection string');
print('4. Test your application');
print('========================================\n');