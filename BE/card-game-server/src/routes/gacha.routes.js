const express = require('express');
const router = express.Router();
const gachaController = require('../controllers/Gacha.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/v1/gacha/pull/single
 * @desc    Pull a single card (costs 1 coin)
 * @access  Private
 */
router.post('/pull/single', authenticate, gachaController.pullSingle);

/**
 * @route   POST /api/v1/gacha/pull/multi
 * @desc    Pull 10 cards (costs 10 coins, guarantees 1 epic)
 * @access  Private
 */
router.post('/pull/multi', authenticate, gachaController.pullMulti);

/**
 * @route   GET /api/v1/gacha/info
 * @desc    Get user's gacha info (coins, pity counters, rates)
 * @access  Private
 */
router.get('/info', authenticate, gachaController.getGachaInfo);

module.exports = router;