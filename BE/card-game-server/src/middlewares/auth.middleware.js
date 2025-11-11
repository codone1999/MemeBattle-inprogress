const { verifyAccessToken } = require('../utils/jwt.util');
const { unauthorizedResponse } = require('../utils/response.util');
const UserRepository = require('../repositories/user.repository');

const userRepository = new UserRepository();

/**
 * Authenticate User Middleware
 * Verifies JWT access token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return unauthorizedResponse(res, 'Access token required');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    if (error.message === 'Access token expired') {
      return unauthorizedResponse(res, 'Access token expired');
    }
    if (error.message === 'Invalid access token') {
      return unauthorizedResponse(res, 'Invalid access token');
    }
    return unauthorizedResponse(res, 'Authentication failed');
  }
};

/**
 * Require Email Verification Middleware
 * Ensures user has verified their email
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, 'Authentication required');
  }

  if (!req.user.isEmailVerified) {
    return unauthorizedResponse(
      res, 
      'Email verification required. Please verify your email to access this resource.'
    );
  }

  next();
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't fail if missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await userRepository.findById(decoded.userId);
      
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth failed:', error.message);
  }

  next();
};

module.exports = {
  authenticate,
  requireEmailVerification,
  optionalAuth
};