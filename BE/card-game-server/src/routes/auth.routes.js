const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validation.middleware');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const {
  registerSchema,
  loginSchema,
  emailVerificationSchema,
  refreshTokenSchema,
  resendVerificationSchema
} = require('../dto/validation/auth.validation');

const router = express.Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify user email (API method)
 * @access  Public
 */
router.post(
  '/verify-email',
  validate(emailVerificationSchema),
  authController.verifyEmail
);

/**
 * @route   GET /api/v1/auth/verify-email?token=xxx
 * @desc    Verify user email (email link method)
 * @access  Public
 */
router.get(
  '/verify-email',
  authController.verifyEmailFromQuery
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post(
  '/resend-verification',
  validate(resendVerificationSchema),
  authController.resendVerification
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private (requires authentication)
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route   GET /api/v1/auth/status
 * @desc    Check authentication status
 * @access  Public (optional authentication)
 */
router.get(
  '/status',
  optionalAuth,
  authController.checkAuthStatus
);

module.exports = router;