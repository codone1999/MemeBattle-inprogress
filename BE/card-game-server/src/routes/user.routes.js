const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateQuery } = require('../middlewares/validation.middleware');
const { searchUserSchema } = require('../dto/validation/user.validation');

/**
 * @route   GET /api/v1/users/search
 * @desc    Search for users by username
 * @access  Private
 */
router.get(
  '/search',
  authenticate,
  validateQuery(searchUserSchema),
  userController.searchUsers
);

module.exports = router;