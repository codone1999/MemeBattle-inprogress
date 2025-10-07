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
  }
};