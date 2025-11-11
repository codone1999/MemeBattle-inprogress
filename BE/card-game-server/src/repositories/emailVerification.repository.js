const EmailVerification = require('../models/EmailVerification.model');

class EmailVerificationRepository {
  /**
   * Create a new email verification token
   * @param {string} accountId - User account ID
   * @returns {Promise<Object>} - Created verification record
   */
  async create(accountId) {
    const verification = new EmailVerification({
      accountId
    });
    return await verification.save();
  }

  /**
   * Find verification by token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} - Verification record or null
   */
  async findByToken(token) {
    return await EmailVerification.findOne({ token });
  }

  /**
   * Find verification by account ID
   * @param {string} accountId - User account ID
   * @returns {Promise<Object|null>} - Verification record or null
   */
  async findByAccountId(accountId) {
    return await EmailVerification.findOne({ accountId, isVerified: false })
      .sort({ createdAt: -1 }); // Get the most recent one
  }

  /**
   * Mark verification as used
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} - Updated verification record
   */
  async markAsVerified(token) {
    return await EmailVerification.findOneAndUpdate(
      { token },
      { $set: { isVerified: true } },
      { new: true }
    );
  }

  /**
   * Delete verification by account ID
   * @param {string} accountId - User account ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteByAccountId(accountId) {
    return await EmailVerification.deleteMany({ accountId });
  }

  /**
   * Delete verification by token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} - Deleted verification record
   */
  async deleteByToken(token) {
    return await EmailVerification.findOneAndDelete({ token });
  }

  /**
   * Check if token is valid and not expired
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} - True if valid
   */
  async isTokenValid(token) {
    const verification = await EmailVerification.findOne({
      token,
      isVerified: false,
      expiryDate: { $gt: new Date() }
    });
    return !!verification;
  }

  /**
   * Delete expired verifications
   * @returns {Promise<Object>} - Delete result
   */
  async deleteExpired() {
    return await EmailVerification.deleteMany({
      expiryDate: { $lt: new Date() }
    });
  }
}

module.exports = EmailVerificationRepository;