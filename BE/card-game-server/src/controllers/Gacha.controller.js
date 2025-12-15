const GachaService = require('../services/Gacha.service');
const {
  successResponse,
  badRequestResponse,
  internalServerErrorResponse
} = require('../utils/response.util');

class GachaController {
  constructor() {
    this.gachaService = new GachaService();
  }

  /**
   * Pull single card
   * POST /api/v1/gacha/pull/single
   */
  pullSingle = async (req, res) => {
    try {
      const userId = req.userId || req.user._id;

      const result = await this.gachaService.pullSingle(userId);

      return successResponse(
        res,
        result,
        'Card pulled successfully'
      );
    } catch (error) {
      console.error('Error pulling single card:', error);

      if (error.message === 'Not enough coins') {
        return badRequestResponse(res, error.message);
      }

      return internalServerErrorResponse(res, error.message);
    }
  };

  /**
   * Pull 10 cards
   * POST /api/v1/gacha/pull/multi
   */
  pullMulti = async (req, res) => {
    try {
      const userId = req.userId || req.user._id;

      const result = await this.gachaService.pullMulti(userId);

      return successResponse(
        res,
        result,
        '10 cards pulled successfully'
      );
    } catch (error) {
      console.error('Error pulling multi cards:', error);

      if (error.message === 'Not enough coins') {
        return badRequestResponse(res, error.message);
      }

      return internalServerErrorResponse(res, error.message);
    }
  };

  /**
   * Pull from special banner
   * POST /api/v1/gacha/pull/special
   */
  pullSpecialBanner = async (req, res) => {
    try {
      const userId = req.userId || req.user._id;

      const result = await this.gachaService.pullSpecialBanner(userId);

      return successResponse(
        res,
        result,
        'Special banner card pulled successfully'
      );
    } catch (error) {
      console.error('Error pulling from special banner:', error);

      if (error.message === 'Not enough coins') {
        return badRequestResponse(res, error.message);
      }

      return internalServerErrorResponse(res, error.message);
    }
  };

  /**
   * Get user gacha info
   * GET /api/v1/gacha/info
   */
  getGachaInfo = async (req, res) => {
    try {
      const userId = req.userId || req.user._id;

      const info = await this.gachaService.getUserGachaInfo(userId);

      return successResponse(
        res,
        info,
        'Gacha info retrieved successfully'
      );
    } catch (error) {
      console.error('Error getting gacha info:', error);
      return internalServerErrorResponse(res, error.message);
    }
  };
}

module.exports = new GachaController();