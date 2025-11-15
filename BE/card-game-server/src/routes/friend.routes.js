const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friend.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate, validateParams } = require('../middlewares/validation.middleware');
const {
  sendRequestSchema,
  requestParamSchema,
  friendParamSchema
} = require('../dto/validation/friend.validation');

// === All friend routes are private and require authentication ===
router.use(authenticate);

/**
 * @route   GET /api/v1/friends
 * @desc    Get the authenticated user's friend list
 * @access  Private
 */
router.get('/', friendController.getMyFriends);

/**
 * @route   POST /api/v1/friends/requests
 * @desc    Send a friend request
 * @access  Private
 */
router.post(
  '/requests',
  validate(sendRequestSchema),
  friendController.sendFriendRequest
);

/**
 * @route   GET /api/v1/friends/requests/sent
 * @desc    Get requests sent by the user
 * @access  Private
 */
router.get('/requests/sent', friendController.getSentRequests);

/**
 * @route   GET /api/v1/friends/requests/pending
 * @desc    Get requests pending for the user
 * @access  Private
 */
router.get('/requests/pending', friendController.getPendingRequests);

/**
 * @route   POST /api/v1/friends/requests/:requestId/accept
 * @desc    Accept a friend request
 * @access  Private
 */
router.post(
  '/requests/:requestId/accept',
  validateParams(requestParamSchema),
  friendController.acceptFriendRequest
);

/**
 * @route   POST /api/v1/friends/requests/:requestId/decline
 * @desc    Decline a friend request
 * @access  Private
 */
router.post(
  '/requests/:requestId/decline',
  validateParams(requestParamSchema),
  friendController.declineFriendRequest
);

/**
 * @route   DELETE /api/v1/friends/:friendId
 * @desc    Remove a friend
 * @access  Private
 */
router.delete(
  '/:friendId',
  validateParams(friendParamSchema),
  friendController.removeFriend
);

module.exports = router;