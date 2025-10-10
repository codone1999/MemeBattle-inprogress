import { UserRepository } from '../repositories/UserRepository.js';
import { InventoryRepository } from '../repositories/InventoryRepository.js';
import { FriendRepository } from '../repositories/FriendRepository.js';
import { FriendRequestRepository } from '../repositories/FriendRequestRepository.js';
import { CardRepository } from '../repositories/CardRepository.js';
import { CharacterRepository } from '../repositories/CharacterRepository.js';
import { MapRepository } from '../repositories/MapRepository.js';

const userRepo = new UserRepository();
const inventoryRepo = new InventoryRepository();
const friendRepo = new FriendRepository();
const friendRequestRepo = new FriendRequestRepository();
const cardRepo = new CardRepository();
const characterRepo = new CharacterRepository();
const mapRepo = new MapRepository();

export const userService = {
  async updateProfile(uid, { username, profilePicture, selectedCharacter }) {
    const updates = {};
    
    if (username) {
      // Check if username is already taken
      const existing = await userRepo.findOne(
        'username = ? AND uid != ?',
        [username, uid]
      );
      if (existing) {
        throw new Error('Username already taken');
      }
      updates.username = username;
    }
    
    if (profilePicture !== undefined) {
      updates.profile_picture = profilePicture;
    }
    
    if (Object.keys(updates).length === 0 && selectedCharacter === undefined) {
      throw new Error('No fields to update');
    }
    
    if (Object.keys(updates).length > 0) {
      await userRepo.update(uid, updates);
    }
    
    // Update selected character in inventory
    if (selectedCharacter !== undefined) {
      await inventoryRepo.update(uid, { selected_character: selectedCharacter });
    }
    
    return this.getUserProfile(uid);
  },

  async getFriends(uid) {
    try {
      const friends = await friendRepo.getFriendsList(uid);
      console.log(`✅ Found ${friends.length} friends for user ${uid}`);
      return friends;
    } catch (error) {
      console.error('❌ Error fetching friends:', error);
      throw error;
    }
  },

  async sendFriendRequest(fromUid, toUsername) {
    // Find user by username
    const toUser = await userRepo.findByUsername(toUsername);
    
    if (!toUser) {
      throw new Error('User not found');
    }
    
    if (toUser.uid === fromUid) {
      throw new Error('Cannot add yourself as friend');
    }
    
    // Check if already friends
    const areFriends = await friendRepo.areFriends(fromUid, toUser.uid);
    if (areFriends) {
      throw new Error('Already friends');
    }
    
    // Check if request already exists
    const existingRequest = await friendRequestRepo.findPendingRequest(fromUid, toUser.uid);
    if (existingRequest) {
      throw new Error('Friend request already sent');
    }
    
    // Create friend request
    await friendRequestRepo.createRequest(fromUid, toUser.uid);
    
    return { message: 'Friend request sent' };
  },

  async acceptFriendRequest(requestId, uid) {
    const request = await friendRequestRepo.findOne(
      'id = ? AND to_user_id = ? AND status = ?',
      [requestId, uid, 'pending']
    );
    
    if (!request) {
      throw new Error('Friend request not found');
    }
    
    // Add to friends (both directions)
    await friendRepo.addFriendship(request.to_user_id, request.from_user_id);
    
    // Update request status
    await friendRequestRepo.updateStatus(requestId, 'accepted');
    
    return { message: 'Friend request accepted' };
  },

  async removeFriend(uid, friendUid) {
    await friendRepo.removeFriendship(uid, friendUid);
    return { message: 'Friend removed' };
  },

  async getFriendRequests(uid) {
    return await friendRequestRepo.getPendingRequests(uid);
  },
  
  async getUserProfile(uid) {
    const user = await userRepo.findById(uid);
    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async getUserInventory(uid) {
    const inventory = await inventoryRepo.findByUserId(uid);
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  },

  async updateInventory(uid, { cardid, deckid, characterid }) {
    const inventory = await inventoryRepo.findByUserId(uid);

    // Merge new items with existing
    const updatedCardId = cardid ? [...new Set([...inventory.cardid, ...cardid])] : inventory.cardid;
    const updatedDeckId = deckid ? [...new Set([...inventory.deckid, ...deckid])] : inventory.deckid;
    const updatedCharacterId = characterid ? [...new Set([...inventory.characterid, ...characterid])] : inventory.characterid;

    await inventoryRepo.updateInventory(uid, {
      cardid: updatedCardId,
      deckid: updatedDeckId,
      characterid: updatedCharacterId
    });

    return await inventoryRepo.findByUserId(uid);
  },

  async getAllCards() {
    const cards = await cardRepo.findAll();
    return cards.map(card => ({
      ...card,
      pawnLocations: JSON.parse(card.pawnLocations || '[]'),
      Ability: card.Ability === 1
    }));
  },

  async getAllCharacters() {
    return await characterRepo.findAll('1=1', [], 'idcharacter');
  },

  async getAllMaps() {
    return await mapRepo.getAllMaps();
  },

  async updateSelectedCharacter(uid, characterId) {
    // Verify user owns this character
    const inventory = await inventoryRepo.findByUserId(uid);
    
    if (!inventory.characterid.includes(characterId)) {
      throw new Error('You do not own this character');
    }

    // Update selected character
    await inventoryRepo.update(uid, { selected_character: characterId });

    return { message: 'Character updated successfully', characterId };
  }
};