// MongoDB Schema Initialization Script
// Run this script using: mongosh <connection-string> < mongodb-schema-init.js
// Or use MongoDB Compass or any MongoDB client

const dbName = 'board_game_db';

// Connect to database
use(dbName);

// Drop existing collections if you want a fresh start (CAREFUL - this deletes data!)
// db.users.drop();
// db.emailVerifications.drop();
// db.passwordResets.drop();
// db.inventories.drop();
// db.decks.drop();
// db.characters.drop();
// db.cards.drop();
// db.friendRequests.drop();
// db.maps.drop();
// db.games.drop();
// db.chatMessages.drop();

print('Creating collections with validators...');

// ========================================
// 1. USERS COLLECTION
// ========================================
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['uid', 'username', 'email', 'password', 'displayName'],
      properties: {
        uid: {
          bsonType: 'string',
          description: 'Unique user identifier - required'
        },
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
        characterId: {
          bsonType: 'objectId',
          description: 'Main character for this deck'
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
// ========================================
db.createCollection('characters', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'characterPic'],
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
        stats: {
          bsonType: 'object',
          properties: {
            health: { bsonType: 'int', minimum: 1 },
            attack: { bsonType: 'int', minimum: 0 },
            defense: { bsonType: 'int', minimum: 0 }
          }
        },
        abilities: {
          bsonType: 'object',
          properties: {
            skillDescription: { bsonType: 'string' },
            pawnLocationEffect: { bsonType: 'object' },
            scoreEffect: { bsonType: 'object' },
            buff: { bsonType: 'object' },
            debuff: { bsonType: 'object' },
            addPawn: { bsonType: 'object' },
            dropCardInSquare: { bsonType: 'object' },
            extraPawn: { bsonType: 'int' },
            reducePawn: { bsonType: 'int' }
          }
        },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.characters.createIndex({ name: 1 });
db.characters.createIndex({ rarity: 1 });

print('✓ Characters collection created');

// ========================================
// 7. CARDS COLLECTION
// ========================================
db.createCollection('cards', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'power'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Card name'
        },
        power: {
          bsonType: 'int',
          minimum: 0,
          description: 'Card power level'
        },
        rarity: {
          enum: ['common', 'rare', 'epic', 'legendary'],
          description: 'Card rarity'
        },
        cardType: {
          enum: ['attack', 'defense', 'special', 'support'],
          description: 'Card type'
        },
        pawnLocation: {
          bsonType: 'object',
          properties: {
            x: { bsonType: 'int' },
            y: { bsonType: 'int' },
            restrictions: { bsonType: 'array' }
          }
        },
        ability: {
          bsonType: 'object',
          properties: {
            abilityType: { bsonType: 'string' },
            abilityLocation: { bsonType: 'object' },
            description: { bsonType: 'string' },
            effect: { bsonType: 'object' }
          }
        },
        cardInfo: {
          bsonType: 'string',
          description: 'Card description'
        },
        cardImage: {
          bsonType: 'string',
          description: 'Card image URL'
        },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.cards.createIndex({ name: 1 });
db.cards.createIndex({ rarity: 1 });
db.cards.createIndex({ cardType: 1 });
db.cards.createIndex({ power: -1 });

print('✓ Cards collection created');

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
// ========================================
db.createCollection('maps', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'image'],
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
            width: { bsonType: 'int', minimum: 3 },
            height: { bsonType: 'int', minimum: 3 }
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
              type: { bsonType: 'string' },
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
// 10. GAMES COLLECTION
// ========================================
db.createCollection('games', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['players', 'mapId', 'status'],
      properties: {
        players: {
          bsonType: 'array',
          minItems: 1,
          maxItems: 2,
          items: {
            bsonType: 'object',
            required: ['userId', 'deckId', 'score'],
            properties: {
              userId: { bsonType: 'objectId' },
              deckId: { bsonType: 'objectId' },
              score: { bsonType: 'int', minimum: 0 },
              pawns: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    position: {
                      bsonType: 'object',
                      properties: {
                        x: { bsonType: 'int' },
                        y: { bsonType: 'int' }
                      }
                    },
                    characterId: { bsonType: 'objectId' },
                    power: { bsonType: 'int' }
                  }
                }
              }
            }
          }
        },
        mapId: {
          bsonType: 'objectId',
          description: 'Reference to map'
        },
        currentTurn: {
          bsonType: 'int',
          minimum: 0,
          description: 'Current turn number'
        },
        currentPlayer: {
          bsonType: 'objectId',
          description: 'Player whose turn it is'
        },
        status: {
          enum: ['waiting', 'active', 'completed', 'abandoned'],
          description: 'Game status'
        },
        winner: {
          bsonType: 'objectId',
          description: 'Winner user ID'
        },
        gameState: {
          bsonType: 'object',
          description: 'Current game board state'
        },
        moves: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              playerId: { bsonType: 'objectId' },
              action: { bsonType: 'string' },
              timestamp: { bsonType: 'date' },
              details: { bsonType: 'object' }
            }
          }
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
db.games.createIndex({ createdAt: -1 });
db.games.createIndex({ completedAt: -1 });
db.games.createIndex({ currentPlayer: 1, status: 1 });

print('✓ Games collection created');

// ========================================
// 11. CHAT MESSAGES COLLECTION
// ========================================
db.createCollection('chatMessages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['gameId', 'userId', 'message', 'timestamp'],
      properties: {
        gameId: {
          bsonType: 'objectId',
          description: 'Reference to game'
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
print('========================================');
print('Collections created:');
print('  1. users');
print('  2. emailVerifications');
print('  3. passwordResets');
print('  4. inventories');
print('  5. decks');
print('  6. characters');
print('  7. cards');
print('  8. friendRequests');
print('  9. maps');
print(' 10. games');
print(' 11. chatMessages');
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
print('2. Configure your application connection string');
print('3. Test your application');
print('========================================\n');