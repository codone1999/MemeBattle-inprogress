import { getDatabase } from '../config/database.js';

export const userService = {
  // ... existing code ...

/**
 * Update user profile
 */
async updateProfile(uid, { username, profilePicture, selectedCharacter }) {
  const db = await getDatabase();
  
  const updates = [];
  const params = [];
  
  if (username) {
    // Check if username is already taken
    const existing = await db.get(
      'SELECT uid FROM users WHERE username = ? AND uid != ?',
      [username, uid]
    );
    if (existing) {
      throw new Error('Username already taken');
    }
    updates.push('username = ?');
    params.push(username);
  }
  
  if (profilePicture !== undefined) {
    updates.push('profile_picture = ?');
    params.push(profilePicture);
  }
  
  if (updates.length === 0) {
    throw new Error('No fields to update');
  }
  
  params.push(uid);
  
  await db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE uid = ?`,
    params
  );
  
  // Update selected character in inventory
  if (selectedCharacter !== undefined) {
    await db.run(
      `UPDATE inventories SET selected_character = ? WHERE uid = ?`,
      [selectedCharacter, uid]
    );
  }
  
  return this.getUserProfile(uid);
},

/**
 * Get friends list
 */
async getFriends(uid) {
  const db = await getDatabase();
  
  try {
    const friends = await db.all(`
      SELECT 
        u.uid, 
        u.username, 
        u.is_online, 
        u.last_login, 
        u.elo_rating,
        i.selected_character
      FROM friends f
      JOIN users u ON (f.friend_id = u.uid)
      LEFT JOIN inventories i ON (u.uid = i.uid)
      WHERE f.user_id = ?
      ORDER BY u.is_online DESC, u.username ASC
    `, [uid]);
    
    console.log(`✅ Found ${friends.length} friends for user ${uid}`);
    
    return friends;
  } catch (error) {
    console.error('❌ Error fetching friends:', error);
    throw error;
  }
},

/**
 * Send friend request
 */
async sendFriendRequest(fromUid, toUsername) {
  const db = await getDatabase();
  
  // Find user by username
  const toUser = await db.get(
    'SELECT uid FROM users WHERE username = ?',
    [toUsername]
  );
  
  if (!toUser) {
    throw new Error('User not found');
  }
  
  if (toUser.uid === fromUid) {
    throw new Error('Cannot add yourself as friend');
  }
  
  // Check if already friends
  const existing = await db.get(
    'SELECT id FROM friends WHERE user_id = ? AND friend_id = ?',
    [fromUid, toUser.uid]
  );
  
  if (existing) {
    throw new Error('Already friends');
  }
  
  // Check if request already exists
  const existingRequest = await db.get(
    'SELECT id FROM friend_requests WHERE from_user_id = ? AND to_user_id = ? AND status = "pending"',
    [fromUid, toUser.uid]
  );
  
  if (existingRequest) {
    throw new Error('Friend request already sent');
  }
  
  // Create friend request
  await db.run(
    `INSERT INTO friend_requests (from_user_id, to_user_id, status) VALUES (?, ?, 'pending')`,
    [fromUid, toUser.uid]
  );
  
  return { message: 'Friend request sent' };
},

/**
 * Accept friend request
 */
async acceptFriendRequest(requestId, uid) {
  const db = await getDatabase();
  
  const request = await db.get(
    'SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ? AND status = "pending"',
    [requestId, uid]
  );
  
  if (!request) {
    throw new Error('Friend request not found');
  }
  
  // Add to friends (both directions)
  await db.run(
    'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
    [request.to_user_id, request.from_user_id]
  );
  
  await db.run(
    'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)',
    [request.from_user_id, request.to_user_id]
  );
  
  // Update request status
  await db.run(
    `UPDATE friend_requests SET status = 'accepted' WHERE id = ?`,
    [requestId]
  );
  
  return { message: 'Friend request accepted' };
},

/**
 * Remove friend
 */
async removeFriend(uid, friendUid) {
  const db = await getDatabase();
  
  await db.run(
    'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
    [uid, friendUid, friendUid, uid]
  );
  
  return { message: 'Friend removed' };
},

/**
 * Get friend requests
 */
async getFriendRequests(uid) {
  const db = await getDatabase();
  
  const requests = await db.all(`
    SELECT fr.id, fr.from_user_id, fr.created_at,
           u.username, u.elo_rating
    FROM friend_requests fr
    JOIN users u ON (fr.from_user_id = u.uid)
    WHERE fr.to_user_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `, [uid]);
  
  return requests;
},
  
  /**
   * Get user profile
   */
  async getUserProfile(uid) {
    const db = await getDatabase();
    
    const user = await db.get(
      `SELECT uid, username, email, wins, losses, draws, elo_rating, 
              total_games, is_online, created_at, last_login 
       FROM users WHERE uid = ?`,
      [uid]
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  /**
   * Get user inventory
   */
  async getUserInventory(uid) {
    const db = await getDatabase();
    
    const inventory = await db.get(
      'SELECT * FROM inventories WHERE uid = ?',
      [uid]
    );

    if (!inventory) {
      throw new Error('Inventory not found');
    }

    // Parse JSON fields
    return {
      idinventory: inventory.idinventory,
      uid: inventory.uid,
      cardid: JSON.parse(inventory.cardid || '[]'),
      deckid: JSON.parse(inventory.deckid || '[]'),
      characterid: JSON.parse(inventory.characterid || '[]'),
      created_at: inventory.created_at
    };
  },

  /**
   * Update inventory (add card after gacha)
   */
  async updateInventory(uid, { cardid, deckid, characterid }) {
    const db = await getDatabase();
    
    const inventory = await this.getUserInventory(uid);

    // Merge new items with existing
    const updatedCardId = cardid ? [...new Set([...inventory.cardid, ...cardid])] : inventory.cardid;
    const updatedDeckId = deckid ? [...new Set([...inventory.deckid, ...deckid])] : inventory.deckid;
    const updatedCharacterId = characterid ? [...new Set([...inventory.characterid, ...characterid])] : inventory.characterid;

    await db.run(
      `UPDATE inventories 
       SET cardid = ?, deckid = ?, characterid = ? 
       WHERE uid = ?`,
      [
        JSON.stringify(updatedCardId),
        JSON.stringify(updatedDeckId),
        JSON.stringify(updatedCharacterId),
        uid
      ]
    );

    return this.getUserInventory(uid);
  },

  /**
   * Get all cards
   */
  async getAllCards() {
    const db = await getDatabase();
    
    const cards = await db.all('SELECT * FROM cards ORDER BY cardRarity, idcard');
    
    return cards.map(card => ({
      ...card,
      pawnLocations: JSON.parse(card.pawnLocations || '[]'),
      Ability: card.Ability === 1
    }));
  },

  /**
   * Get all characters
   */
  async getAllCharacters() {
    const db = await getDatabase();
    return db.all('SELECT * FROM characters ORDER BY idcharacter');
  },

  /**
   * Get all maps
   */
  async getAllMaps() {
    const db = await getDatabase();
    return db.all('SELECT * FROM maps ORDER BY name');
  },
  /**
 * Update selected character
 */
async updateSelectedCharacter(uid, characterId) {
  const db = await getDatabase();
  
  // Verify user owns this character
  const inventory = await db.get(
    'SELECT characterid FROM inventories WHERE uid = ?',
    [uid]
  );

  const characterIds = JSON.parse(inventory.characterid || '[]');
  
  if (!characterIds.includes(characterId)) {
    throw new Error('You do not own this character');
  }

  // Update selected character
  await db.run(
    'UPDATE inventories SET selected_character = ? WHERE uid = ?',
    [characterId, uid]
  );

  return { message: 'Character updated successfully', characterId };
}
};