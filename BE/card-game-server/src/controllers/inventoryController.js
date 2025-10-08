import { inventoryService } from '../services/inventoryService.js';

export const inventoryController = {
  async getUserDecks(req, res, next) {
    try {
      const decks = await inventoryService.getUserDecks(req.user.uid);
      
      res.json({
        success: true,
        data: { decks }
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserCards(req, res, next) {
    try {
      const deckid = req.query.deckid ? parseInt(req.query.deckid) : null;
      const cards = await inventoryService.getAvailableCards(req.user.uid, deckid);
      
      res.json({
        success: true,
        data: { cards }
      });
    } catch (error) {
      next(error);
    }
  },

  async getDeckCards(req, res, next) {
    try {
      const { deckid } = req.params;
      const cards = await inventoryService.getDeckCards(req.user.uid, parseInt(deckid));
      
      res.json({
        success: true,
        data: { cards }
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserCharacters(req, res, next) {
    try {
      const characters = await inventoryService.getUserCharacters(req.user.uid);
      
      res.json({
        success: true,
        data: { characters }
      });
    } catch (error) {
      next(error);
    }
  },

  async createDeck(req, res, next) {
    try {
      const { deckName, cardIds } = req.body;
      
      if (!cardIds || !Array.isArray(cardIds)) {
        return res.status(400).json({
          success: false,
          message: 'cardIds must be an array'
        });
      }

      const deck = await inventoryService.createDeck(req.user.uid, {
        deckName,
        cardIds
      });
      
      res.status(201).json({
        success: true,
        message: 'Deck created successfully',
        data: { deck }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateDeck(req, res, next) {
    try {
      const { deckid } = req.params;
      const { deckName, cardIds } = req.body;

      const deck = await inventoryService.updateDeck(req.user.uid, parseInt(deckid), {
        deckName,
        cardIds
      });
      
      res.json({
        success: true,
        message: 'Deck updated successfully',
        data: { deck }
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteDeck(req, res, next) {
    try {
      const { deckid } = req.params;

      await inventoryService.deleteDeck(req.user.uid, parseInt(deckid));
      
      res.json({
        success: true,
        message: 'Deck deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};