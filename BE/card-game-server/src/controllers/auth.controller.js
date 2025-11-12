const AuthService = require('../services/auth.service');
const EmailService = require('../services/email.service');
const {
  successResponse,
  createdResponse,
  badRequestResponse
} = require('../utils/response.util');
const {
  RegisterRequestDto,
  LoginRequestDto,
  EmailVerificationRequestDto,
  RefreshTokenRequestDto,
  UserResponseDto
} = require('../dto/auth.dto');

class AuthController {
  constructor() {
    this.authService = new AuthService();
    this.emailService = new EmailService();
  }

  /**
   * Register a new user
   * POST /api/v1/auth/register
   * Returns: User data only (no tokens)
   */
  register = async (req, res, next) => {
    try {
      const registerDto = new RegisterRequestDto(req.body);
      const result = await this.authService.register(registerDto);
      const userDto = new UserResponseDto(result.user);
      
      return createdResponse(
        res,
        { user: userDto },
        'Registration successful! Please check your email to verify your account before logging in.'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   * POST /api/v1/auth/login
   * Returns: Refresh token only (access token set in cookie)
   */
  login = async (req, res, next) => {
    try {
      const loginDto = new LoginRequestDto(req.body);
      const result = await this.authService.login(loginDto);
      
      // Set access token in HTTP-only cookie
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Return ONLY refresh token
      return successResponse(
        res,
        { refreshToken: result.tokens.refreshToken },
        'Login successful!'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   * Body: { "refreshToken": "xxx" }
   * Returns: New refresh token (new access token set in cookie)
   */
  refreshToken = async (req, res, next) => {
    try {
      const { refreshToken } = new RefreshTokenRequestDto(req.body);
      
      if (!refreshToken) {
        return badRequestResponse(
          res,
          'Refresh token is required',
          [{ field: 'refreshToken', message: 'Refresh token must be provided' }]
        );
      }

      const result = await this.authService.refreshAccessToken(refreshToken);
      
      // Set new access token in HTTP-only cookie
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Return new refresh token
      return successResponse(
        res,
        { refreshToken: result.tokens.refreshToken },
        'Token refreshed successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify email - POST method
   * POST /api/v1/auth/verify-email
   * Body: { "token": "xxx" }
   */
  verifyEmail = async (req, res, next) => {
    try {
      const { token } = new EmailVerificationRequestDto(req.body);
      const user = await this.authService.verifyEmail(token);
      const userDto = new UserResponseDto(user);
      
      return successResponse(
        res,
        { user: userDto },
        'Email verified successfully! You can now login to access all features.'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify email - GET method (for email links)
   * GET /api/v1/auth/verify-email?token=xxx
   * Returns: HTML page
   */
  verifyEmailFromQuery = async (req, res, next) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        const errorHtml = this.emailService.getVerificationErrorPage(
          'Verification token is required'
        );
        return res.status(400).send(errorHtml);
      }

      const user = await this.authService.verifyEmail(token);
      const successHtml = this.emailService.getVerificationSuccessPage(user.displayName);
      
      return res.send(successHtml);
    } catch (error) {
      const errorHtml = this.emailService.getVerificationErrorPage(
        error.message || 'Invalid or expired verification token'
      );
      return res.status(400).send(errorHtml);
    }
  };

  /**
   * Resend verification email
   * POST /api/v1/auth/resend-verification
   */
  resendVerification = async (req, res, next) => {
    try {
      const { email } = req.body;
      await this.authService.resendVerificationEmail(email);
      
      return successResponse(
        res,
        null,
        'Verification email sent! Please check your inbox.'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   * POST /api/v1/auth/logout
   * Requires: Authentication
   */
  logout = async (req, res, next) => {
    try {
      await this.authService.logout(req.userId);
      
      // Clear access token cookie
      res.clearCookie('accessToken');
      
      return successResponse(
        res,
        null,
        'Logout successful!'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   * Requires: Authentication (token validated by middleware)
   * Returns: User data only (no tokens)
   */
  getCurrentUser = async (req, res, next) => {
    try {
      // req.userId is set by authenticate middleware after validating token
      const user = await this.authService.getCurrentUser(req.userId);
      const userDto = new UserResponseDto(user);
      
      return successResponse(
        res,
        { user: userDto },
        'User profile retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check authentication status
   * GET /api/v1/auth/status
   * Optional: Token (validated by optionalAuth middleware)
   * Returns: { isAuthenticated, isVerified, user }
   */
  checkAuthStatus = async (req, res, next) => {
    try {
      // If no user in request (no token or invalid token)
      if (!req.user) {
        return successResponse(
          res,
          { 
            isAuthenticated: false,
            isVerified: false,
            user: null
          },
          'User is not authenticated'
        );
      }

      const userDto = new UserResponseDto(req.user);
      
      return successResponse(
        res,
        { 
          isAuthenticated: true,
          isVerified: req.user.isEmailVerified,
          user: userDto
        },
        req.user.isEmailVerified 
          ? 'User is authenticated and verified'
          : 'User is authenticated but email not verified'
      );
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AuthController;