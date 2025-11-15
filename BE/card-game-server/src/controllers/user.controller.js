const UserService = require('../services/user.service');
const { successResponse, internalServerErrorResponse } = require('../utils/response.util');

const userService = new UserService();

class UserController {
  /**
   * @desc Search for users
   * @route GET /api/v1/users/search
   * @access Private
   */
  async searchUsers(req, res) {
    try {
      const { username } = req.query;
      const currentUserId = req.user._id;

      const users = await userService.searchUsers(username, currentUserId);
      
      return successResponse(res, users, 'Users found');
    } catch (error) {
      console.error('Search Users Error:', error);
      return internalServerErrorResponse(res, 'Failed to search for users');
    }
  }
}

module.exports = new UserController();