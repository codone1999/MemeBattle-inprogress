const MapService = require('../services/Map.service');
const {
  successResponse,
  notFoundResponse
} = require('../utils/response.util');

/**
 * Map Controller
 * Handles HTTP requests for map operations
 */
class MapController {
  constructor() {
    this.mapService = new MapService();
  }

  /**
   * GET /api/v1/maps
   * Get all available maps
   */
  getAllMaps = async (req, res, next) => {
    try {
      const query = req.query;
      const result = await this.mapService.getAllMaps(query);

      return successResponse(res, result, 'Maps retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/maps/:mapId
   * Get map by ID
   */
  getMapById = async (req, res, next) => {
    try {
      const { mapId } = req.params;
      const map = await this.mapService.getMapById(mapId);

      return successResponse(res, { map }, 'Map retrieved successfully');
    } catch (error) {
      if (error.message === 'Map not found') {
        return notFoundResponse(res, error.message);
      }
      next(error);
    }
  };
}

module.exports = new MapController();
