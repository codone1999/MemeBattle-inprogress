import bcrypt from 'bcrypt';
import { LobbyRepository } from '../repositories/LobbyRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { getDatabase } from '../config/database.js';

const lobbyRepo = new LobbyRepository();
const userRepo = new UserRepository();

export const lobbyService = {
  async createLobby({ hostUid, lobbyName, isPrivate, password, gameMode }) {
    // Generate unique lobby ID
    const lobbyId = `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Hash password if private
    const hashedPassword = isPrivate && password 
      ? await bcrypt.hash(password, 10)
      : null;

    await lobbyRepo.createLobby({
      lobby_id: lobbyId,
      lobby_name: lobbyName,
      host_user_id: hostUid,
      is_private: isPrivate,
      password: hashedPassword,
      game_mode: gameMode || 'normal'
    });

    const lobby = await lobbyRepo.findById(lobbyId);

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

  async getLobbies(uid) {
    const lobbies = await lobbyRepo.findWaitingLobbies();

    return lobbies.map(lobby => ({
      ...lobby,
      is_private: lobby.is_private === 1,
      player_count: 1 + (lobby.has_guest || 0),
      is_full: lobby.guest_user_id !== null
    }));
  },

  async getLobby(lobbyId) {
    const lobby = await lobbyRepo.findLobbyWithUsers(lobbyId);

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    return {
      ...lobby,
      is_private: lobby.is_private === 1
    };
  },

  async joinLobby({ lobbyId, userId, password }) {
    const lobby = await lobbyRepo.findById(lobbyId);

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
    await lobbyRepo.update(lobbyId, { guest_user_id: userId });

    console.log(`✅ User ${userId} joined lobby ${lobbyId}`);

    return { success: true, lobbyId };
  },

  async leaveLobby({ lobbyId, userId }) {
    try {
      const lobby = await lobbyRepo.findById(lobbyId);

      if (!lobby) {
        console.log(`⚠️ Lobby ${lobbyId} not found - may have been deleted`);
        return;
      }

      // If host leaves, delete lobby
      if (lobby.host_user_id === userId) {
        await lobbyRepo.delete(lobbyId);
        console.log(`✅ Lobby ${lobbyId} deleted (host left)`);
      } 
      // If guest leaves, just clear guest slot
      else if (lobby.guest_user_id === userId) {
        await lobbyRepo.update(lobbyId, {
          guest_user_id: null,
          guest_deck_id: null,
          guest_character_id: null
        });
        console.log(`✅ User ${userId} left lobby ${lobbyId}`);
      }
    } catch (error) {
      console.error(`❌ Error leaving lobby ${lobbyId}:`, error);
      throw error;
    }
  },

  async updateSelection({ lobbyId, userId, deckId, characterId }) {
    const lobby = await lobbyRepo.findById(lobbyId);

    if (!lobby) {
      throw new Error('Lobby not found');
    }

    const updateData = {};

    if (lobby.host_user_id === userId) {
      if (deckId !== undefined) updateData.host_deck_id = deckId;
      if (characterId !== undefined) updateData.host_character_id = characterId;
    } else if (lobby.guest_user_id === userId) {
      if (deckId !== undefined) updateData.guest_deck_id = deckId;
      if (characterId !== undefined) updateData.guest_character_id = characterId;
    }

    if (Object.keys(updateData).length > 0) {
      await lobbyRepo.update(lobbyId, updateData);
    }

    return this.getLobby(lobbyId);
  },

  async updateMap({ lobbyId, mapId }) {
    await lobbyRepo.update(lobbyId, { selected_map: mapId });
    return this.getLobby(lobbyId);
  },

  async startGame(lobbyId) {
    await lobbyRepo.update(lobbyId, {
      status: 'in_progress',
      started_at: new Date().toISOString()
    });

    console.log(`✅ Game started for lobby ${lobbyId}`);
  },

  async sendInvite({ lobbyId, fromUserId, toUserId }) {
    const db = await getDatabase();
    
    // Check if lobby exists
    const lobby = await lobbyRepo.findById(lobbyId);
    if (!lobby) {
      throw new Error('Lobby not found');
    }

    // Check if lobby is full
    if (lobby.guest_user_id) {
      throw new Error('Lobby is already full');
    }

    // Check if recipient is already in a lobby
    const recipientLobby = await lobbyRepo.findUserActiveLobby(toUserId);
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

  async declineInvite({ inviteId, userId }) {
    const db = await getDatabase();
    
    await db.run(
      'UPDATE lobby_invites SET status = "declined" WHERE id = ? AND to_user_id = ?',
      [inviteId, userId]
    );
  },

  async getUserActiveLobby(userId) {
    const lobby = await lobbyRepo.findUserActiveLobby(userId);
    
    if (!lobby) {
      return null;
    }

    return {
      ...lobby,
      is_private: lobby.is_private === 1
    };
  },

  async checkUsersInLobby(userIds) {
    return await lobbyRepo.checkUsersInLobby(userIds);
  }
};