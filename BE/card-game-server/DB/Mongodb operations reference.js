// MongoDB Quick Reference & Common Operations
// Use this in mongosh for quick database operations

const dbName = 'board_game_db';
use(dbName);

print('='.repeat(50));
print('MongoDB Quick Reference Guide');
print('='.repeat(50));

// ========================================
// DATABASE INFORMATION
// ========================================
print('\n--- Database Information ---');

// Show current database
print(`Current Database: ${db.getName()}`);

// List all collections
print('\nCollections:');
db.getCollectionNames().forEach(name => {
  const count = db[name].countDocuments();
  print(`  ${name}: ${count} documents`);
});

// Database stats
print('\nDatabase Stats:');
printjson(db.stats());

// ========================================
// USER OPERATIONS
// ========================================
print('\n--- Common User Operations ---');

// Find user by username or email
print('\n// Find user by username:');
print('db.users.findOne({ username: "testplayer" })');

print('\n// Find user by email:');
print('db.users.findOne({ email: "test@example.com" })');

print('\n// Find online users:');
print('db.users.find({ isOnline: true })');

print('\n// Update user display name:');
print('db.users.updateOne(');
print('  { username: "testplayer" },');
print('  { $set: { displayName: "New Name", updatedAt: new Date() } }');
print(')');

print('\n// Update user stats after game:');
print('db.users.updateOne(');
print('  { _id: ObjectId("user_id") },');
print('  {');
print('    $inc: { "stats.totalGames": 1, "stats.wins": 1 },');
print('    $set: { "stats.winRate": 75.5 }');
print('  }');
print(')');

print('\n// Add friend to user:');
print('db.users.updateOne(');
print('  { _id: ObjectId("user_id") },');
print('  { $addToSet: { friends: ObjectId("friend_id") } }');
print(')');

// ========================================
// INVENTORY & DECK OPERATIONS
// ========================================
print('\n--- Inventory & Deck Operations ---');

print('\n// Get user inventory with card details:');
print('db.inventories.aggregate([');
print('  { $match: { userId: ObjectId("user_id") } },');
print('  { $lookup: {');
print('      from: "cards",');
print('      localField: "cards.cardId",');
print('      foreignField: "_id",');
print('      as: "cardDetails"');
print('  }}');
print('])');

print('\n// Add card to inventory:');
print('db.inventories.updateOne(');
print('  { userId: ObjectId("user_id") },');
print('  {');
print('    $push: {');
print('      cards: {');
print('        cardId: ObjectId("card_id"),');
print('        quantity: 1,');
print('        acquiredAt: new Date()');
print('      }');
print('    }');
print('  }');
print(')');

print('\n// Create new deck:');
print('db.decks.insertOne({');
print('  deckTitle: "My Deck",');
print('  userId: ObjectId("user_id"),');
print('  cards: [');
print('    { cardId: ObjectId("card_id_1"), position: 0 },');
print('    { cardId: ObjectId("card_id_2"), position: 1 }');
print('  ],');
print('  characterId: ObjectId("character_id"),');
print('  isActive: true,');
print('  createdAt: new Date(),');
print('  updatedAt: new Date()');
print('})');

print('\n// Get user decks with full card info:');
print('db.decks.aggregate([');
print('  { $match: { userId: ObjectId("user_id") } },');
print('  { $lookup: {');
print('      from: "cards",');
print('      localField: "cards.cardId",');
print('      foreignField: "_id",');
print('      as: "cardDetails"');
print('  }},');
print('  { $lookup: {');
print('      from: "characters",');
print('      localField: "characterId",');
print('      foreignField: "_id",');
print('      as: "character"');
print('  }}');
print('])');

// ========================================
// GAME OPERATIONS
// ========================================
print('\n--- Game Operations ---');

print('\n// Create new game:');
print('db.games.insertOne({');
print('  players: [{');
print('    userId: ObjectId("player1_id"),');
print('    deckId: ObjectId("deck_id"),');
print('    score: 0,');
print('    pawns: []');
print('  }],');
print('  mapId: ObjectId("map_id"),');
print('  currentTurn: 0,');
print('  status: "waiting",');
print('  gameState: {},');
print('  moves: [],');
print('  createdAt: new Date()');
print('})');

print('\n// Join existing game:');
print('db.games.updateOne(');
print('  { _id: ObjectId("game_id"), status: "waiting" },');
print('  {');
print('    $push: {');
print('      players: {');
print('        userId: ObjectId("player2_id"),');
print('        deckId: ObjectId("deck_id"),');
print('        score: 0,');
print('        pawns: []');
print('      }');
print('    },');
print('    $set: {');
print('      status: "active",');
print('      startedAt: new Date(),');
print('      currentPlayer: ObjectId("player1_id")');
print('    }');
print('  }');
print(')');

print('\n// Find active games:');
print('db.games.find({ status: "active" })');

print('\n// Find games for user:');
print('db.games.find({ "players.userId": ObjectId("user_id") })');

print('\n// Update game state (make move):');
print('db.games.updateOne(');
print('  { _id: ObjectId("game_id") },');
print('  {');
print('    $push: {');
print('      moves: {');
print('        playerId: ObjectId("player_id"),');
print('        action: "place_card",');
print('        timestamp: new Date(),');
print('        details: { cardId: ObjectId("card_id"), position: {x: 2, y: 1} }');
print('      }');
print('    },');
print('    $set: {');
print('      gameState: { /* updated game state */ },');
print('      currentTurn: 2,');
print('      currentPlayer: ObjectId("next_player_id")');
print('    }');
print('  }');
print(')');

print('\n// End game:');
print('db.games.updateOne(');
print('  { _id: ObjectId("game_id") },');
print('  {');
print('    $set: {');
print('      status: "completed",');
print('      winner: ObjectId("winner_id"),');
print('      completedAt: new Date()');
print('    }');
print('  }');
print(')');

// ========================================
// FRIEND OPERATIONS
// ========================================
print('\n--- Friend Operations ---');

print('\n// Send friend request:');
print('db.friendRequests.insertOne({');
print('  fromUserId: ObjectId("sender_id"),');
print('  toUserId: ObjectId("receiver_id"),');
print('  status: "pending",');
print('  createdAt: new Date()');
print('})');

print('\n// Accept friend request:');
print('// 1. Update request status');
print('db.friendRequests.updateOne(');
print('  { _id: ObjectId("request_id") },');
print('  {');
print('    $set: {');
print('      status: "accepted",');
print('      respondedAt: new Date()');
print('    }');
print('  }');
print(')');
print('// 2. Add to both users friend lists');
print('db.users.updateOne(');
print('  { _id: ObjectId("user1_id") },');
print('  { $addToSet: { friends: ObjectId("user2_id") } }');
print(')');
print('db.users.updateOne(');
print('  { _id: ObjectId("user2_id") },');
print('  { $addToSet: { friends: ObjectId("user1_id") } }');
print(')');

print('\n// Get pending friend requests:');
print('db.friendRequests.find({');
print('  toUserId: ObjectId("user_id"),');
print('  status: "pending"');
print('})');

print('\n// Get user friends with details:');
print('db.users.aggregate([');
print('  { $match: { _id: ObjectId("user_id") } },');
print('  { $lookup: {');
print('      from: "users",');
print('      localField: "friends",');
print('      foreignField: "_id",');
print('      as: "friendDetails"');
print('  }},');
print('  { $project: {');
print('      "friendDetails.password": 0,');
print('      "friendDetails.email": 0');
print('  }}');
print('])');

// ========================================
// ANALYTICS QUERIES
// ========================================
print('\n--- Analytics & Reports ---');

print('\n// Top players by win rate:');
print('db.users.find(');
print('  { "stats.totalGames": { $gte: 5 } }');
print(').sort({ "stats.winRate": -1 }).limit(10)');

print('\n// Most played maps:');
print('db.games.aggregate([');
print('  { $group: {');
print('      _id: "$mapId",');
print('      gamesPlayed: { $sum: 1 }');
print('  }},');
print('  { $sort: { gamesPlayed: -1 } },');
print('  { $lookup: {');
print('      from: "maps",');
print('      localField: "_id",');
print('      foreignField: "_id",');
print('      as: "mapInfo"');
print('  }}');
print('])');

print('\n// Most used cards:');
print('db.decks.aggregate([');
print('  { $unwind: "$cards" },');
print('  { $group: {');
print('      _id: "$cards.cardId",');
print('      timesUsed: { $sum: 1 }');
print('  }},');
print('  { $sort: { timesUsed: -1 } },');
print('  { $limit: 10 },');
print('  { $lookup: {');
print('      from: "cards",');
print('      localField: "_id",');
print('      foreignField: "_id",');
print('      as: "cardInfo"');
print('  }}');
print('])');

print('\n// Average game duration:');
print('db.games.aggregate([');
print('  { $match: { status: "completed" } },');
print('  { $project: {');
print('      duration: {');
print('        $subtract: ["$completedAt", "$startedAt"]');
print('      }');
print('  }},');
print('  { $group: {');
print('      _id: null,');
print('      avgDuration: { $avg: "$duration" },');
print('      minDuration: { $min: "$duration" },');
print('      maxDuration: { $max: "$duration" }');
print('  }}');
print('])');

// ========================================
// MAINTENANCE OPERATIONS
// ========================================
print('\n--- Maintenance Operations ---');

print('\n// Remove expired verification tokens:');
print('db.emailVerifications.deleteMany({');
print('  expiryDate: { $lt: new Date() }');
print('})');

print('\n// Remove expired password reset tokens:');
print('db.passwordResets.deleteMany({');
print('  expiryDate: { $lt: new Date() }');
print('})');

print('\n// Remove old rejected friend requests (30 days):');
print('const thirtyDaysAgo = new Date();');
print('thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);');
print('db.friendRequests.deleteMany({');
print('  status: "rejected",');
print('  respondedAt: { $lt: thirtyDaysAgo }');
print('})');

print('\n// Archive old completed games (90 days):');
print('const ninetyDaysAgo = new Date();');
print('ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);');
print('db.games.updateMany(');
print('  {');
print('    status: "completed",');
print('    completedAt: { $lt: ninetyDaysAgo }');
print('  },');
print('  { $set: { archived: true } }');
print(')');

// ========================================
// USEFUL INDEXES
// ========================================
print('\n--- Additional Useful Indexes ---');

print('\n// Create compound index for faster game queries:');
print('db.games.createIndex({ status: 1, createdAt: -1 })');

print('\n// Create text index for searching cards:');
print('db.cards.createIndex({ name: "text", cardInfo: "text" })');

print('\n// Create text index for searching characters:');
print('db.characters.createIndex({ name: "text", "abilities.skillDescription": "text" })');

print('\n// Text search example:');
print('db.cards.find({ $text: { $search: "damage" } })');

// ========================================
// BACKUP & RESTORE
// ========================================
print('\n--- Backup & Restore ---');

print('\n// Backup (run in terminal):');
print('mongodump --uri="mongodb://localhost:27017/board_game_db" --out=./backup');

print('\n// Restore (run in terminal):');
print('mongorestore --uri="mongodb://localhost:27017/board_game_db" ./backup/board_game_db');

print('\n// Export specific collection:');
print('mongoexport --uri="mongodb://localhost:27017/board_game_db" --collection=users --out=users.json');

print('\n// Import collection:');
print('mongoimport --uri="mongodb://localhost:27017/board_game_db" --collection=users --file=users.json');

// ========================================
// PERFORMANCE MONITORING
// ========================================
print('\n--- Performance Monitoring ---');

print('\n// Explain query plan:');
print('db.users.find({ isOnline: true }).explain("executionStats")');

print('\n// Show current operations:');
print('db.currentOp()');

print('\n// Show slow queries (set profiling level):');
print('db.setProfilingLevel(1, { slowms: 100 })');
print('db.system.profile.find().sort({ ts: -1 }).limit(5)');

print('\n// Check index usage:');
print('db.users.aggregate([');
print('  { $indexStats: {} }');
print('])');

print('\n' + '='.repeat(50));
print('End of Quick Reference Guide');
print('='.repeat(50) + '\n');

// Sample queries you can run right now
print('Try these queries:\n');
print('1. db.characters.find().pretty()');
print('2. db.cards.find({ rarity: "legendary" }).pretty()');
print('3. db.maps.find().pretty()');
print('4. db.users.findOne({ username: "testplayer" })');
print('5. db.decks.find().pretty()\n');