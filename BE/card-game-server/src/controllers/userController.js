// userController.js - Fixed to prevent default image memory leak
import { UserRepository } from '../repositories/UserRepository.js';
import { InventoryRepository } from '../repositories/InventoryRepository.js';
import { CardRepository } from '../repositories/CardRepository.js';
import { CharacterRepository } from '../repositories/CharacterRepository.js';
import { MapRepository } from '../repositories/MapRepository.js';
import { FriendRepository } from '../repositories/FriendRepository.js';

const userRepo = new UserRepository();
const inventoryRepo = new InventoryRepository();
const cardRepo = new CardRepository();
const characterRepo = new CharacterRepository();
const mapRepo = new MapRepository();
const friendRepo = new FriendRepository();

export const userController = {
  async getProfile(req, res, next) {
    try {
      const user = await userRepo.findByUid(req.user.uid);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      const inventory = await inventoryRepo.findByUserId(req.user.uid);
      const selectedCharacter = inventory?.selected_character || null;
      let profilePicture = user.profile_picture;
      if (!profilePicture || 
          profilePicture === 'default.png' || 
          profilePicture.includes('default.png')) {
        profilePicture = null;
      }

      res.json({
        success: true,
        data: {
          uid: user.uid,
          username: user.username,
          email: user.email,
          wins: user.wins,
          losses: user.losses,
          draws: user.draws,
          elo_rating: user.elo_rating,
          total_games: user.total_games,
          profile_picture: profilePicture, 
          selected_character: selectedCharacter,
          created_at: user.created_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { username, email, profile_picture } = req.body;
      let cleanedProfilePicture = profile_picture;
      if (!cleanedProfilePicture || 
          cleanedProfilePicture === '' || 
          cleanedProfilePicture === 'default.png' ||
          cleanedProfilePicture.includes('default.png')) {
        cleanedProfilePicture = null;
      }

      await userRepo.updateProfile(req.user.uid, {
        username,
        email,
        profile_picture: cleanedProfilePicture
      });

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getInventory(req, res, next) {
    try {
      const inventory = await inventoryRepo.findByUserId(req.user.uid);

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: 'Inventory not found'
        });
      }

      res.json({
        success: true,
        data: {
          cardid: inventory.cardid || [],
          deckid: inventory.deckid || [],
          characterid: inventory.characterid || [],
          selected_character: inventory.selected_character || null
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateInventory(req, res, next) {
    try {
      const { cardid, deckid, characterid } = req.body;

      await inventoryRepo.updateInventory(req.user.uid, {
        cardid,
        deckid,
        characterid
      });

      res.json({
        success: true,
        message: 'Inventory updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async updateSelectedCharacter(req, res, next) {
    try {
      const { characterId } = req.body;

      if (!characterId) {
        return res.status(400).json({
          success: false,
          message: 'Character ID is required'
        });
      }

      // Verify user owns this character
      const inventory = await inventoryRepo.findByUserId(req.user.uid);
      
      if (!inventory.characterid.includes(characterId)) {
        return res.status(403).json({
          success: false,
          message: 'You do not own this character'
        });
      }

      await inventoryRepo.updateSelectedCharacter(req.user.uid, characterId);

      res.json({
        success: true,
        message: 'Selected character updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllCards(req, res, next) {
    try {
      const cards = await cardRepo.findAll();

      res.json({
        success: true,
        data: { cards }
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllCharacters(req, res, next) {
    try {
      const characters = await characterRepo.findAll();

      res.json({
        success: true,
        data: { characters }
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllMaps(req, res, next) {
    try {
      const maps = await mapRepo.findAll();

      res.json({
        success: true,
        data: { maps }
      });
    } catch (error) {
      next(error);
    }
  },

  async getFriends(req, res, next) {
    try {
      const friends = await friendRepo.getFriends(req.user.uid);

      // FIXED: Clean profile pictures for friends too
      const cleanedFriends = friends.map(friend => ({
        ...friend,
        profile_picture: (!friend.profile_picture || 
                         friend.profile_picture === 'default.png' || 
                         friend.profile_picture.includes('default.png')) 
                         ? null 
                         : friend.profile_picture
      }));

      res.json({
        success: true,
        data: { friends: cleanedFriends }
      });
    } catch (error) {
      next(error);
    }
  },

  async getFriendRequests(req, res, next) {
    try {
      const requests = await friendRepo.getPendingRequests(req.user.uid);

      // FIXED: Clean profile pictures for friend requests too
      const cleanedRequests = requests.map(request => ({
        ...request,
        profile_picture: (!request.profile_picture || 
                         request.profile_picture === 'default.png' || 
                         request.profile_picture.includes('default.png')) 
                         ? null 
                         : request.profile_picture
      }));

      res.json({
        success: true,
        data: { requests: cleanedRequests }
      });
    } catch (error) {
      next(error);
    }
  },

  async sendFriendRequest(req, res, next) {
    try {
      const { friendUsername } = req.body;

      if (!friendUsername) {
        return res.status(400).json({
          success: false,
          message: 'Friend username is required'
        });
      }

      // Find friend by username
      const friend = await userRepo.findByUsername(friendUsername);

      if (!friend) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (friend.uid === req.user.uid) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add yourself as a friend'
        });
      }

      // Check if already friends
      const areFriends = await friendRepo.areFriends(req.user.uid, friend.uid);

      if (areFriends) {
        return res.status(400).json({
          success: false,
          message: 'Already friends with this user'
        });
      }

      // Check if request already exists
      const existingRequest = await friendRepo.findRequest(req.user.uid, friend.uid);

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Friend request already sent'
        });
      }

      await friendRepo.createRequest(req.user.uid, friend.uid);

      res.json({
        success: true,
        message: 'Friend request sent successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async acceptFriendRequest(req, res, next) {
    try {
      const { requestId } = req.params;

      // Verify request exists and is for this user
      const request = await friendRepo.findRequestById(requestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Friend request not found'
        });
      }

      if (request.to_user_id !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: 'Cannot accept this request'
        });
      }

      await friendRepo.acceptRequest(requestId, request.from_user_id, request.to_user_id);

      res.json({
        success: true,
        message: 'Friend request accepted'
      });
    } catch (error) {
      next(error);
    }
  },

  async removeFriend(req, res, next) {
    try {
      const { friendUid } = req.params;

      await friendRepo.removeFriend(req.user.uid, parseInt(friendUid));

      res.json({
        success: true,
        message: 'Friend removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};