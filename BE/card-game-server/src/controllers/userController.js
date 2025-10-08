import { userService } from '../services/userService.js';

export const userController = {
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserProfile(req.user.uid);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  async getInventory(req, res, next) {
    try {
      const inventory = await userService.getUserInventory(req.user.uid);
      
      res.json({
        success: true,
        data: { inventory }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateInventory(req, res, next) {
    try {
      const { cardid, deckid, characterid } = req.body;
      const inventory = await userService.updateInventory(req.user.uid, {
        cardid,
        deckid,
        characterid
      });
      
      res.json({
        success: true,
        message: 'Inventory updated successfully',
        data: { inventory }
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllCards(req, res, next) {
    try {
      const cards = await userService.getAllCards();
      
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
      const characters = await userService.getAllCharacters();
      
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
      const maps = await userService.getAllMaps();
      
      res.json({
        success: true,
        data: { maps }
      });
    } catch (error) {
      next(error);
    }
  },
  async updateProfile(req, res, next) {
  try {
    const { username, profilePicture, selectedCharacter } = req.body;
    const user = await userService.updateProfile(req.user.uid, {
      username,
      profilePicture,
      selectedCharacter
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
},

async getFriends(req, res, next) {
  try {
    const friends = await userService.getFriends(req.user.uid);
    
    res.json({
      success: true,
      data: { friends }
    });
  } catch (error) {
    next(error);
  }
},

async sendFriendRequest(req, res, next) {
  try {
    const { username } = req.body;
    const result = await userService.sendFriendRequest(req.user.uid, username);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
},

async acceptFriendRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const result = await userService.acceptFriendRequest(parseInt(requestId), req.user.uid);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
},

async removeFriend(req, res, next) {
  try {
    const { friendUid } = req.params;
    const result = await userService.removeFriend(req.user.uid, parseInt(friendUid));
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
},

async getFriendRequests(req, res, next) {
  try {
    const requests = await userService.getFriendRequests(req.user.uid);
    
    res.json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    next(error);
  }
},
async updateSelectedCharacter(req, res, next) {
  try {
    const { characterId } = req.body;
    const result = await userService.updateSelectedCharacter(req.user.uid, characterId);
    
    res.json({
      success: true,
      message: result.message,
      data: { characterId: result.characterId }
    });
  } catch (error) {
    next(error);
  }
}
};