const User = require('../models/User.model');

class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User or null
   */
  async findById(id) {
    return await User.findById(id).select('-password');
  }

  /**
   * Find user by ID (including password)
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User or null
   */
  async findByIdWithPassword(id) {
    return await User.findById(id);
  }

  /**
   * Find user by UID
   * @param {string} uid - User UID
   * @returns {Promise<Object|null>} - User or null
   */
  async findByUid(uid) {
    return await User.findOne({ uid }).select('-password');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User or null
   */
  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} - User or null
   */
  async findByUsername(username) {
    return await User.findOne({ username: username.toLowerCase() });
  }

  /**
   * Find user by email or username (including password)
   * @param {string} email - Email
   * @param {string} username - Username
   * @returns {Promise<Object|null>} - User or null
   */
  async findByEmailOrUsername(email, username) {
    const query = {};
    if (email) query.email = email.toLowerCase();
    if (username) query.username = username.toLowerCase();

    return await User.findOne({
      $or: [
        email ? { email: email.toLowerCase() } : null,
        username ? { username: username.toLowerCase() } : null
      ].filter(Boolean)
    });
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated user
   */
  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
  }

  /**
   * Verify user email
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Updated user
   */
  async verifyEmail(userId) {
    return await User.findByIdAndUpdate(
      userId,
      { $set: { isEmailVerified: true } },
      { new: true }
    ).select('-password');
  }

  /**
   * Update user online status
   * @param {string} userId - User ID
   * @param {boolean} isOnline - Online status
   * @returns {Promise<Object|null>} - Updated user
   */
  async updateOnlineStatus(userId, isOnline) {
    return await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          isOnline,
          ...(isOnline ? { lastLogin: new Date() } : {})
        }
      },
      { new: true }
    ).select('-password');
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - True if exists
   */
  async emailExists(email) {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} - True if exists
   */
  async usernameExists(username) {
    const count = await User.countDocuments({ username: username.toLowerCase() });
    return count > 0;
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - Deleted user
   */
  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }

  /**
   * Get user stats
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User stats
   */
  async getUserStats(userId) {
    const user = await User.findById(userId).select('stats');
    return user ? user.stats : null;
  }

  /**
   * Set user inventory reference
   * @param {string} userId - User ID
   * @param {string} inventoryId - Inventory ID
   * @returns {Promise<Object|null>} - Updated user
   */
  async setInventory(userId, inventoryId) {
    return await User.findByIdAndUpdate(
      userId,
      { $set: { inventory: inventoryId } },
      { new: true }
    ).select('-password');
  }
}

module.exports = UserRepository;