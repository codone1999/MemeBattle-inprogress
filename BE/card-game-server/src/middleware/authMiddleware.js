import { verifyAccessToken } from '../utils/jwt.js';

export function authMiddleware(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No access token provided. Please login.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify access token
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach user info to request
    
    next();
  } catch (error) {
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired access token'
    });
  }
}

// Optional: Middleware for optional authentication
export function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}