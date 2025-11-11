const UserRepository = require('../repositories/user.repository');
const EmailVerificationRepository = require('../repositories/emailVerification.repository');
const EmailService = require('./email.service');
const InventoryService = require('./inventory.service');
const { hashPassword, verifyPassword } = require('../utils/password.util');
const { generateTokens } = require('../utils/jwt.util');
const { AppError } = require('../middlewares/errorHandler.middleware');

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.emailVerificationRepository = new EmailVerificationRepository();
    this.emailService = new EmailService();
    this.inventoryService = new InventoryService();
  }

  /**
   * Register a new user
   * @param {Object} registerData - Registration data
   * @returns {Promise<Object>} - User and tokens
   */
  async register(registerData) {
    const { email, username, password, displayName } = registerData;

    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(email);
    if (emailExists) {
      throw new AppError('Email is already registered', 409);
    }

    // Check if username already exists
    const usernameExists = await this.userRepository.usernameExists(username);
    if (usernameExists) {
      throw new AppError('Username is already taken', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      username,
      password: hashedPassword,
      displayName,
      isEmailVerified: false,
      isOnline: true,
      lastLogin: new Date()
    });

    // Create email verification token
    const verification = await this.emailVerificationRepository.create(user._id);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        user.displayName,
        verification.token
      );
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't block registration if email fails
    }

    // Create starter pack (inventory)
    try {
      const inventory = await this.inventoryService.createStarterPack(user._id);
      await this.userRepository.setInventory(user._id, inventory._id);
    } catch (inventoryError) {
      console.error('Failed to create starter pack:', inventoryError);
      // Continue even if starter pack creation fails
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      tokens
    };
  }

  /**
   * Login user
   * @param {Object} loginData - Login credentials
   * @returns {Promise<Object>} - User and tokens
   */
  async login(loginData) {
    const { email, username, password } = loginData;

    // Find user by email or username
    const user = await this.userRepository.findByEmailOrUsername(email, username);

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(user.password, password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update online status and last login
    await this.userRepository.updateOnlineStatus(user._id, true);

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      tokens
    };
  }

  /**
   * Verify user email
   * @param {string} token - Verification token
   * @returns {Promise<Object>} - Verified user
   */
  async verifyEmail(token) {
    // Find verification record
    const verification = await this.emailVerificationRepository.findByToken(token);

    if (!verification) {
      throw new AppError('Invalid verification token', 400);
    }

    // Check if already verified
    if (verification.isVerified) {
      throw new AppError('Email already verified', 400);
    }

    // Check if expired
    if (new Date() > verification.expiryDate) {
      throw new AppError('Verification token has expired', 400);
    }

    // Mark verification as used
    await this.emailVerificationRepository.markAsVerified(token);

    // Verify user email
    const user = await this.userRepository.verifyEmail(verification.accountId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.displayName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't block verification if welcome email fails
    }

    return user;
  }

  /**
   * Resend verification email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resendVerificationEmail(email) {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Delete old verification tokens
    await this.emailVerificationRepository.deleteByAccountId(user._id);

    // Create new verification token
    const verification = await this.emailVerificationRepository.create(user._id);

    // Resend verification email
    await this.emailService.resendVerificationEmail(
      user.email,
      user.displayName,
      verification.token
    );
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async logout(userId) {
    // Update online status
    await this.userRepository.updateOnlineStatus(userId, false);
  }

  /**
   * Get current user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile
   */
  async getCurrentUser(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}

module.exports = AuthService;