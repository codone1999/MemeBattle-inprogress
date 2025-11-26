const express = require('express');
const router = express.Router();
const MapController = require('../controllers/Map.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * Map Routes
 * All routes require authentication
 */

// GET /api/v1/maps - Get all maps
router.get('/', authenticate, MapController.getAllMaps);

// GET /api/v1/maps/:mapId - Get map by ID
router.get('/:mapId', authenticate, MapController.getMapById);

module.exports = router;
