import { getDatabase } from '../config/database.js';
import bcrypt from 'bcrypt';

export const lobbyService = {
  /**
   * Create lobby
   */
  async createLobby({ hostUid, lobbyName, isPrivate, password, gameMode }) {
    const db = await getDatabase();
    
    // Generate unique lobby ID
    const lobbyId = `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Hash password if private
    const hashedPassword = isPrivate && password 
      ? await bcrypt.hash(password, 10)
      : null;

    await db.run(
      `INSERT INTO lobbies (
        lobby_id, lobby_name, host_user_id, status, max_players, 
        is_private, password, game_mode, created_at
      ) VALUES (?, ?, ?, 'waiting', 2, ?, ?, ?, datetime('now'))`,
      [lobbyId, lobbyName, hostUid, isPrivate ? 1 : 0, hashedPassword, gameMode || 'normal']
    );

    const lobby = await db.get(
      'SELECT * FROM lobbies WHERE lobby_id = ?',
      [lobbyId]
    );

    console.log('✅ Lobby created:', lobbyId);

    return {
      id: lobby.id,
      lobby_id: lobbyId,
      lobby_name: lobbyName,
      host_user_id: hostUid,
      is_private: isPrivate,
      game_mode: gameMode,
      status: 'waiting',
      max_players: 2
    };
  },

  /**
   * Get all lobbies
   */
  async getLobbies(uid) {
    const db = await getDatabase();
    
    const lobbies = await db.all(`
      SELECT 
        l.*,
        u.username as host_username,
        CASE WHEN l.guest_user_id IS NOT NULL THEN 1 ELSE 0 END as has_guest
      FROM lobbies l
      LEFT JOIN users u ON l.host_user_id = u.uid
      WHERE l.status = 'waiting'
      ORDER BY l.created_at DESC
    `);

    return lobbies.map(lobby => ({
      ...lobby,
      is_private: lobby.is_private === 1,
      player_count: 1 + (lobby.has_guest || 0),
      is_full: lobby.guest_user_id !== null
    }));
  },

  /**
   * Get lobby by ID
   */
  async getLobby(lobbyId) {
    const db = await getDatabase();
    
    const lobby = await db.get(
      `SELECT l.*, 
              h.username as host_username,
              g.username as guest_username
       FROM lobbies l
       LEFT JOIN users h ON l.host_user_id = h.uid
       LEFT JOIN users g ON l.guest_user_id = g.uid
       WHERE l.lobby_id = ?`,
      [lobbyId]
    );

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    return {
      ...lobby,
      is_private: lobby.is_private === 1
    };
  },

  /**
   * Join lobby
   */
  async joinLobby({ lobbyId, userId, password }) {
    const db = await getDatabase();
    
    const lobby = await db.get(
      'SELECT * FROM lobbies WHERE lobby_id = ?',
      [lobbyId]
    );

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    if (lobby.guest_user_id) {
      throw new Error('Lobby is full');
    }

    // Verify password if private
    if (lobby.is_private && lobby.password) {
      if (!password) {
        throw new Error('Password required');
      }
      const isValid = await bcrypt.compare(password, lobby.password);
      if (!isValid) {
        throw new Error('Invalid password');
      }
    }

    // Join lobby
    await db.run(
      'UPDATE lobbies SET guest_user_id = ? WHERE lobby_id = ?',
      [userId, lobbyId]
    );

    console.log(`✅ User ${userId} joined lobby ${lobbyId}`);

    return { success: true, lobbyId };
  },

/**
 * Leave lobby
 */
async leaveLobby({ lobbyId, userId }) {
  const db = await getDatabase();
  
  try {
    const lobby = await db.get(
      'SELECT * FROM lobbies WHERE lobby_id = ?',
      [lobbyId]  // ✅ Don't parse as int - it's a string
    );

    if (!lobby) {
      console.log(`⚠️ Lobby ${lobbyId} not found - may have been deleted`);
      return;
    }

    // If host leaves, delete lobby
    if (lobby.host_user_id === userId) {
      await db.run('DELETE FROM lobbies WHERE lobby_id = ?', [lobbyId]);
      console.log(`✅ Lobby ${lobbyId} deleted (host left)`);
    } 
    // If guest leaves, just clear guest slot
    else if (lobby.guest_user_id === userId) {
      await db.run(
        'UPDATE lobbies SET guest_user_id = NULL, guest_deck_id = NULL, guest_character_id = NULL WHERE lobby_id = ?',
        [lobbyId]
      );
      console.log(`✅ User ${userId} left lobby ${lobbyId}`);
    }
  } catch (error) {
    console.error(`❌ Error leaving lobby ${lobbyId}:`, error);
    throw error;
  }
},

  /**
   * Update player selection (deck, character)
   */
  async updateSelection({ lobbyId, userId, deckId, characterId }) {
    const db = await getDatabase();
    
    const lobby = await db.get(
      'SELECT * FROM lobbies WHERE lobby_id = ?',
      [lobbyId]
    );

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    let updateQuery = '';
    const params = [];

    if (lobby.host_user_id === userId) {
      if (deckId !== undefined) {
        updateQuery = 'UPDATE lobbies SET host_deck_id = ? WHERE lobby_id = ?';
        params.push(deckId, lobbyId);
      } else if (characterId !== undefined) {
        updateQuery = 'UPDATE lobbies SET host_character_id = ? WHERE lobby_id = ?';
        params.push(characterId, lobbyId);
      }
    } else if (lobby.guest_user_id === userId) {
      if (deckId !== undefined) {
        updateQuery = 'UPDATE lobbies SET guest_deck_id = ? WHERE lobby_id = ?';
        params.push(deckId, lobbyId);
      } else if (characterId !== undefined) {
        updateQuery = 'UPDATE lobbies SET guest_character_id = ? WHERE lobby_id = ?';
        params.push(characterId, lobbyId);
      }
    }

    if (updateQuery) {
      await db.run(updateQuery, params);
    }

    return this.getLobby(lobbyId);
  },

  /**
   * Update map
   */
  async updateMap({ lobbyId, mapId }) {
    const db = await getDatabase();
    
    await db.run(
      'UPDATE lobbies SET selected_map = ? WHERE lobby_id = ?',
      [mapId, lobbyId]
    );

    return this.getLobby(lobbyId);
  },

  /**
   * Start game
   */
  async startGame(lobbyId) {
    const db = await getDatabase();
    
    await db.run(
      `UPDATE lobbies SET status = 'in_progress', started_at = datetime('now') WHERE lobby_id = ?`,
      [lobbyId]
    );

    console.log(`✅ Game started for lobby ${lobbyId}`);
  },

/**
 * Send lobby invite
 */
async sendInvite({ lobbyId, fromUserId, toUserId }) {
  const db = await getDatabase();
  
  // Check if lobby exists
  const lobby = await db.get(
    'SELECT * FROM lobbies WHERE lobby_id = ?',
    [lobbyId]
  );

  if (!lobby) {
    throw new Error('Lobby not found');
  }

  // Check if lobby is full
  if (lobby.guest_user_id) {
    throw new Error('Lobby is already full');
  }

  // Check if recipient is already in a lobby
  const recipientLobby = await db.get(
    `SELECT l.lobby_id, l.lobby_name 
     FROM lobbies l
     WHERE (l.host_user_id = ? OR l.guest_user_id = ?)
       AND l.status = 'waiting'
     LIMIT 1`,
    [toUserId, toUserId]
  );

  if (recipientLobby) {
    throw new Error(`This friend is already in "${recipientLobby.lobby_name}"`);
  }

  // Check if already invited
  const existing = await db.get(
    'SELECT * FROM lobby_invites WHERE lobby_id = ? AND to_user_id = ? AND status = "pending"',
    [lobbyId, toUserId]
  );

  if (existing) {
    throw new Error('Already invited this friend');
  }

  await db.run(
    `INSERT INTO lobby_invites (lobby_id, from_user_id, to_user_id, status, created_at)
     VALUES (?, ?, ?, 'pending', datetime('now'))`,
    [lobbyId, fromUserId, toUserId]
  );

  console.log(`✅ Invite sent from ${fromUserId} to ${toUserId} for lobby ${lobbyId}`);

  return { success: true };
},
  /**
   * Get pending invites
   */
  async getPendingInvites(userId) {
    const db = await getDatabase();
    
    const invites = await db.all(`
      SELECT 
        li.*,
        l.lobby_name,
        l.game_mode,
        l.is_private,
        u.username as from_username
      FROM lobby_invites li
      LEFT JOIN lobbies l ON li.lobby_id = l.lobby_id
      LEFT JOIN users u ON li.from_user_id = u.uid
      WHERE li.to_user_id = ? 
        AND li.status = 'pending'
        AND l.status = 'waiting'
      ORDER BY li.created_at DESC
    `, [userId]);

    return invites;
  },

  /**
   * Accept invite
   */
  async acceptInvite({ inviteId, userId }) {
    const db = await getDatabase();
    
    const invite = await db.get(
      'SELECT * FROM lobby_invites WHERE id = ? AND to_user_id = ?',
      [inviteId, userId]
    );

    if (!invite) {
      throw new Error('Invite not found');
    }

    // Update status
    await db.run(
      'UPDATE lobby_invites SET status = "accepted" WHERE id = ?',
      [inviteId]
    );

    return { lobbyId: invite.lobby_id };
  },

  /**
   * Decline invite
   */
  async declineInvite({ inviteId, userId }) {
    const db = await getDatabase();
    
    await db.run(
      'UPDATE lobby_invites SET status = "declined" WHERE id = ? AND to_user_id = ?',
      [inviteId, userId]
    );
  },
  // Add this method to lobbyService
/**
 * Get user's active lobby (if they're in one)
 */
async getUserActiveLobby(userId) {
  const db = await getDatabase();
  
  const lobby = await db.get(
    `SELECT l.*, 
            h.username as host_username,
            g.username as guest_username
     FROM lobbies l
     LEFT JOIN users h ON l.host_user_id = h.uid
     LEFT JOIN users g ON l.guest_user_id = g.uid
     WHERE (l.host_user_id = ? OR l.guest_user_id = ?) 
       AND l.status = 'waiting'
     LIMIT 1`,
    [userId, userId]
  );

  if (!lobby) {
    return null;
  }

  return {
    ...lobby,
    is_private: lobby.is_private === 1
  };
},
/**
 * Check if users are in active lobbies
 */
async checkUsersInLobby(userIds) {
  const db = await getDatabase();
  
  const placeholders = userIds.map(() => '?').join(',');
  
  const users = await db.all(`
    SELECT DISTINCT 
      CASE 
        WHEN l.host_user_id IN (${placeholders}) THEN l.host_user_id
        WHEN l.guest_user_id IN (${placeholders}) THEN l.guest_user_id
      END as user_id,
      l.lobby_id,
      l.lobby_name
    FROM lobbies l
    WHERE (l.host_user_id IN (${placeholders}) OR l.guest_user_id IN (${placeholders}))
      AND l.status = 'waiting'
  `, [...userIds, ...userIds]);
  
  return users.reduce((acc, user) => {
    if (user.user_id) {
      acc[user.user_id] = {
        lobby_id: user.lobby_id,
        lobby_name: user.lobby_name
      };
    }
    return acc;
  }, {});
}
};