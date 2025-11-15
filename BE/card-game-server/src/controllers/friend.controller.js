const FriendService = require('../services/friend.service');
const { 
  successResponse, 
  createdResponse, 
  badRequestResponse,
  notFoundResponse,
  forbiddenResponse,
  internalServerErrorResponse 
} = require('../utils/response.util');

const friendService = new FriendService();

class FriendController {
  
  /**
   * @desc Get current user's friend list
   * @route GET /api/v1/friends
   * @access Private
   */
  async getMyFriends(req, res) {
    try {
      const userId = req.user._id;
      const friends = await friendService.getFriends(userId);
      return successResponse(res, friends, 'Friends retrieved');
    } catch (error) {
      console.error('Get My Friends Error:', error);
      return internalServerErrorResponse(res, 'Failed to get friends');
    }
  }

  /**
   * @desc Send a friend request
   * @route POST /api/v1/friends/requests
   * @access Private
   */
  async sendFriendRequest(req, res) {
    try {
      const fromUserId = req.user._id;
      const { toUserId } = req.body;

      const newRequest = await friendService.sendRequest(fromUserId, toUserId);
      return createdResponse(res, newRequest, 'Friend request sent');
    } catch (error) {
      console.error('Send Request Error:', error);
      if (error.message.includes('Yourself') || 
          error.message.includes('already friends') || 
          error.message.includes('already exists')) {
        return badRequestResponse(res, error.message);
      }
      return internalServerErrorResponse(res, 'Failed to send request');
    }
  }

  /**
   * @desc Get all requests sent by the user
   * @route GET /api/v1/friends/requests/sent
   * @access Private
   */
  async getSentRequests(req, res) {
    try {
      const userId = req.user._id;
      const requests = await friendService.getSentRequests(userId);
      return successResponse(res, requests, 'Sent requests retrieved');
    } catch (error) {
      console.error('Get Sent Requests Error:', error);
      return internalServerErrorResponse(res, 'Failed to get sent requests');
    }
  }

  /**
   * @desc Get all requests pending for the user
   * @route GET /api/v1/friends/requests/pending
   * @access Private
   */
  async getPendingRequests(req, res) {
    try {
      const userId = req.user._id;
      const requests = await friendService.getPendingRequests(userId);
      return successResponse(res, requests, 'Pending requests retrieved');
    } catch (error) {
      console.error('Get Pending Requests Error:', error);
      return internalServerErrorResponse(res, 'Failed to get pending requests');
    }
  }

  /**
   * @desc Accept a friend request
   * @route POST /api/v1/friends/requests/:requestId/accept
   * @access Private
   */
  async acceptFriendRequest(req, res) {
    try {
      const { requestId } = req.params;
      const currentUserId = req.user._id.toString();

      await friendService.acceptRequest(requestId, currentUserId);
      return successResponse(res, null, 'Friend request accepted');
    } catch (error) {
      console.error('Accept Request Error:', error);
      if (error.message.includes('not found')) {
        return notFoundResponse(res, error.message);
      }
      if (error.message.includes('permission')) {
        return forbiddenResponse(res, error.message);
      }
      if (error.message.includes('no longer pending')) {
        return badRequestResponse(res, error.message);
      }
      return internalServerErrorResponse(res, 'Failed to accept request');
    }
  }

  /**
   * @desc Decline a friend request
   * @route POST /api/v1/friends/requests/:requestId/decline
   * @access Private
   */
  async declineFriendRequest(req, res) {
    try {
      const { requestId } = req.params;
      const currentUserId = req.user._id.toString();

      await friendService.declineRequest(requestId, currentUserId);
      return successResponse(res, null, 'Friend request declined');
    } catch (error) {
      console.error('Decline Request Error:', error);
      if (error.message.includes('not found')) {
        return notFoundResponse(res, error.message);
      }
      if (error.message.includes('permission')) {
        return forbiddenResponse(res, error.message);
      }
      if (error.message.includes('no longer pending')) {
        return badRequestResponse(res, error.message);
      }
      return internalServerErrorResponse(res, 'Failed to decline request');
    }
  }

  /**
   * @desc Remove a friend
   * @route DELETE /api/v1/friends/:friendId
   * @access Private
   */
  async removeFriend(req, res) {
    try {
      const { friendId } = req.params;
      const currentUserId = req.user._id;

      if (friendId === currentUserId.toString()) {
        return badRequestResponse(res, 'You cannot remove yourself as a friend.');
      }

      await friendService.removeFriend(currentUserId, friendId);
      return successResponse(res, null, 'Friend removed successfully');
    } catch (error) {
      console.error('Remove Friend Error:', error);
      return internalServerErrorResponse(res, 'Failed to remove friend');
    }
  }
}

module.exports = new FriendController();