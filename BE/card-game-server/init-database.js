// init-database.js - Complete SQLite Database with Authentication & Matchmaking
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import fs from 'fs';

async function initDatabase() {
  console.log('🗄️  Initializing Card Game Database...\n');

  const db = await open({
    filename: './game.db',
    driver: sqlite3.Database
  });

  console.log('📝 Creating tables...\n');

  // Drop existing tables for clean start
  await db.exec(`
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS cards;
    DROP TABLE IF EXISTS decks;
    DROP TABLE IF EXISTS characters;
    DROP TABLE IF EXISTS inventories;
    DROP TABLE IF EXISTS maps;
    DROP TABLE IF EXISTS lobbies;
    DROP TABLE IF EXISTS game_history;
    DROP TABLE IF EXISTS friend_requests;
    DROP TABLE IF EXISTS friends;
  `);

  // ==================== USERS TABLE (With Authentication) ====================
  await db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid INTEGER UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      elo_rating INTEGER DEFAULT 1000,
      total_games INTEGER DEFAULT 0,
      is_online INTEGER DEFAULT 0,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Users table created (with stats & online status)');

  // ==================== CARDS TABLE ====================
  await db.exec(`
    CREATE TABLE cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idcard INTEGER UNIQUE NOT NULL,
      cardname TEXT NOT NULL,
      Power INTEGER NOT NULL DEFAULT 0,
      pawnsRequired INTEGER NOT NULL DEFAULT 1,
      pawnLocations TEXT DEFAULT '[]',
      abilityType TEXT DEFAULT 'non',
      cardRarity TEXT DEFAULT 'Standard',
      Ability INTEGER DEFAULT 0,
      cardinfo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Cards table created');

  // ==================== CHARACTERS TABLE ====================
  await db.exec(`
    CREATE TABLE characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idcharacter INTEGER UNIQUE NOT NULL,
      charatername TEXT NOT NULL,
      themeColor TEXT DEFAULT 'bg-gray-800',
      border TEXT DEFAULT 'border-gray-600',
      textColor TEXT DEFAULT 'text-white',
      shadow TEXT DEFAULT 'shadow-gray-700',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Characters table created');

  // ==================== MAPS TABLE ====================
  await db.exec(`
    CREATE TABLE maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mapid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Maps table created');

  // ==================== DECKS TABLE ====================
  await db.exec(`
    CREATE TABLE decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deckid INTEGER UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      cardid TEXT NOT NULL DEFAULT '[]',
      deck_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);
  console.log('✅ Decks table created');

  // ==================== INVENTORIES TABLE ====================
  await db.exec(`
    CREATE TABLE inventories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idinventory INTEGER UNIQUE NOT NULL,
      uid INTEGER NOT NULL,
      cardid TEXT DEFAULT '[]',
      deckid TEXT DEFAULT '[]',
      characterid TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);
  console.log('✅ Inventories table created');

  // ==================== LOBBIES/ROOMS TABLE (Matchmaking) ====================
  await db.exec(`
    CREATE TABLE lobbies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lobby_id TEXT UNIQUE NOT NULL,
      lobby_name TEXT,
      host_user_id INTEGER NOT NULL,
      guest_user_id INTEGER,
      host_deck_id INTEGER,
      guest_deck_id INTEGER,
      host_character_id INTEGER,
      guest_character_id INTEGER,
      selected_map TEXT,
      status TEXT DEFAULT 'waiting',
      max_players INTEGER DEFAULT 2,
      is_private INTEGER DEFAULT 0,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      FOREIGN KEY (host_user_id) REFERENCES users(uid),
      FOREIGN KEY (guest_user_id) REFERENCES users(uid)
    );
  `);
  console.log('✅ Lobbies table created (for matchmaking)');

  // ==================== GAME HISTORY TABLE ====================
  await db.exec(`
    CREATE TABLE game_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT UNIQUE NOT NULL,
      lobby_id TEXT,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      winner_id INTEGER,
      player1_score INTEGER,
      player2_score INTEGER,
      player1_character INTEGER,
      player2_character INTEGER,
      game_duration INTEGER,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player1_id) REFERENCES users(uid),
      FOREIGN KEY (player2_id) REFERENCES users(uid),
      FOREIGN KEY (winner_id) REFERENCES users(uid)
    );
  `);
  console.log('✅ Game history table created');

  // ==================== FRIENDS TABLE ====================
  await db.exec(`
    CREATE TABLE friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(uid) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    );
  `);
  console.log('✅ Friends table created');

  // ==================== FRIEND REQUESTS TABLE ====================
  await db.exec(`
    CREATE TABLE friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(uid) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(uid) ON DELETE CASCADE,
      UNIQUE(from_user_id, to_user_id)
    );
  `);
  console.log('✅ Friend requests table created');

  // ==================== CREATE INDEXES ====================
  console.log('\n📊 Creating indexes...\n');

  await db.exec(`
    CREATE INDEX idx_users_username ON users(username);
    CREATE INDEX idx_users_uid ON users(uid);
    CREATE INDEX idx_users_online ON users(is_online);
    CREATE INDEX idx_cards_idcard ON cards(idcard);
    CREATE INDEX idx_cards_rarity ON cards(cardRarity);
    CREATE INDEX idx_decks_user ON decks(user_id);
    CREATE INDEX idx_decks_deckid ON decks(deckid);
    CREATE INDEX idx_inventories_uid ON inventories(uid);
    CREATE INDEX idx_lobbies_status ON lobbies(status);
    CREATE INDEX idx_lobbies_host ON lobbies(host_user_id);
    CREATE INDEX idx_game_history_players ON game_history(player1_id, player2_id);
    CREATE INDEX idx_friends_user ON friends(user_id);
  `);
  console.log('✅ All indexes created');

  // ==================== IMPORT DATA FROM JSON ====================
  console.log('\n📥 Importing data from db.json...\n');

  const jsonData = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

  // Import Cards
  console.log('🃏 Importing cards...');
  for (const card of jsonData.card) {
    await db.run(
      `INSERT INTO cards (idcard, cardname, Power, pawnsRequired, pawnLocations, abilityType, cardRarity, Ability, cardinfo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.idcard,
        card.cardname,
        card.Power,
        parseInt(card.pawnsRequired),
        JSON.stringify(card.pawnLocations),
        card.abilityType,
        card.cardRarity,
        card.Ability ? 1 : 0,
        card.cardinfo
      ]
    );
  }
  console.log(`✅ Imported ${jsonData.card.length} cards`);

  // Import Characters
  console.log('👤 Importing characters...');
  for (const char of jsonData.character) {
    await db.run(
      `INSERT INTO characters (idcharacter, charatername, themeColor, border, textColor, shadow) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        char.idcharacter,
        char.charatername,
        char.themeColor,
        char.border,
        char.textColor,
        char.shadow
      ]
    );
  }
  console.log(`✅ Imported ${jsonData.character.length} characters`);

  // Import Maps
  console.log('🗺️  Importing maps...');
  for (const map of jsonData.maps) {
    await db.run(
      `INSERT INTO maps (mapid, name, image) VALUES (?, ?, ?)`,
      [map.id, map.name, map.image]
    );
  }
  console.log(`✅ Imported ${jsonData.maps.length} maps`);

  // Import Users (hash passwords)
  console.log('👥 Importing users (hashing passwords)...');
  for (const user of jsonData.users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await db.run(
      `INSERT INTO users (uid, username, password, created_at) VALUES (?, ?, ?, datetime('now'))`,
      [user.uid, user.username, hashedPassword]
    );
  }
  console.log(`✅ Imported ${jsonData.users.length} users (passwords hashed)`);

  // Import Decks
  console.log('📦 Importing decks...');
  for (const deck of jsonData.deck) {
    // Try to find user_id from inventory
    const inv = jsonData.inventory.find(i => i.deckid && i.deckid.includes(deck.deckid));
    const userId = inv ? inv.uid : null;
    
    if (userId) {
      await db.run(
        `INSERT INTO decks (deckid, user_id, cardid) VALUES (?, ?, ?)`,
        [deck.deckid, userId, JSON.stringify(deck.cardid)]
      );
    }
  }
  console.log(`✅ Imported ${jsonData.deck.length} decks`);

  // Import Inventories
  console.log('🎒 Importing inventories...');
  for (const inv of jsonData.inventory) {
    if (inv.uid) {
      await db.run(
        `INSERT INTO inventories (idinventory, uid, cardid, deckid, characterid) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          inv.idinventory,
          inv.uid,
          JSON.stringify(inv.cardid || []),
          JSON.stringify(inv.deckid || []),
          JSON.stringify(inv.characterid || [])
        ]
      );
    }
  }
  console.log(`✅ Imported ${jsonData.inventory.filter(i => i.uid).length} inventories`);

  // ==================== CREATE DEMO DATA ====================
  console.log('\n🎮 Creating demo matchmaking lobby...\n');

  await db.run(
    `INSERT INTO lobbies (lobby_id, lobby_name, host_user_id, status, max_players, is_private, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    ['demo-lobby-1', 'Test Lobby', 1111, 'waiting', 2, 0]
  );
  console.log('✅ Demo lobby created');

  // ==================== DATABASE STATISTICS ====================
  console.log('\n📊 Database Statistics:\n');

  const stats = {
    users: await db.get('SELECT COUNT(*) as count FROM users'),
    cards: await db.get('SELECT COUNT(*) as count FROM cards'),
    characters: await db.get('SELECT COUNT(*) as count FROM characters'),
    decks: await db.get('SELECT COUNT(*) as count FROM decks'),
    inventories: await db.get('SELECT COUNT(*) as count FROM inventories'),
    maps: await db.get('SELECT COUNT(*) as count FROM maps'),
    lobbies: await db.get('SELECT COUNT(*) as count FROM lobbies')
  };

  console.log(`Users:       ${stats.users.count}`);
  console.log(`Cards:       ${stats.cards.count}`);
  console.log(`Characters:  ${stats.characters.count}`);
  console.log(`Decks:       ${stats.decks.count}`);
  console.log(`Inventories: ${stats.inventories.count}`);
  console.log(`Maps:        ${stats.maps.count}`);
  console.log(`Lobbies:     ${stats.lobbies.count}`);

  // ==================== VERIFY DATA ====================
  console.log('\n🔍 Sample Data:\n');

  const sampleUser = await db.get('SELECT uid, username, wins, losses, elo_rating FROM users LIMIT 1');
  console.log('Sample User:');
  console.log(JSON.stringify(sampleUser, null, 2));

  const sampleCard = await db.get('SELECT idcard, cardname, Power, cardRarity FROM cards LIMIT 1');
  console.log('\nSample Card:');
  console.log(JSON.stringify(sampleCard, null, 2));

  const sampleLobby = await db.get('SELECT lobby_id, lobby_name, status FROM lobbies LIMIT 1');
  console.log('\nSample Lobby:');
  console.log(JSON.stringify(sampleLobby, null, 2));

  await db.close();

  console.log('\n✨ Database initialization complete!\n');
  console.log('📁 Database file: game.db');
  console.log('🔐 All passwords are hashed with bcrypt');
  console.log('🎮 Ready for online matchmaking!');
  console.log('\n📝 Test Accounts:');
  console.log('   Username: test1, Password: test1');
  console.log('   Username: test2, Password: test2\n');
}

// Run initialization
initDatabase().catch((error) => {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
});