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

      // Return ONLY refresh token (no user data, no access token)
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
   * Requires: Authentication (token in cookie or header)
   * Returns: User data only (no tokens)
   */
  getCurrentUser = async (req, res, next) => {
    try {
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
   * Checks: Token validity AND email verification
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