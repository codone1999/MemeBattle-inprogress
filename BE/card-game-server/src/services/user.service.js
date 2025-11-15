const UserRepository = require('../repositories/user.repository');
const { UserSearchResponseDto } = require('../dto/friend.dto');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Search for users
   * @param {string} usernameQuery - Partial username
   * @param {string} currentUserId - ID of user performing search
   * @returns {Promise<Array>}
   */
  async searchUsers(usernameQuery, currentUserId) {
    // Get current user's friends to exclude them
    const user = await this.userRepository.findById(currentUserId);
    const friendIds = user.friends || [];

    const users = await this.userRepository.searchByUsername(
      usernameQuery, 
      currentUserId, 
      friendIds
    );
      
    return users.map(user => new UserSearchResponseDto(user));
  }
}

module.exports = UserService;