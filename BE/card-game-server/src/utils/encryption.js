import bcrypt from 'bcryptjs';

export const encryptionUtils = {
  /**
   * Hash password
   */
  async hashPassword(password) {
    if (!password) return null;
    return await bcrypt.hash(password, 10);
  },

  /**
   * Verify password
   */
  async verifyPassword(password, hash) {
    if (!password || !hash) return false;
    return await bcrypt.compare(password, hash);
  }
};