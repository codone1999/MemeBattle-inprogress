const AuthService = require('../services/auth.service');
const {
  successResponse,
  createdResponse,
  badRequestResponse
} = require('../utils/response.util');
const {
  RegisterRequestDto,
  LoginRequestDto,
  EmailVerificationRequestDto,
  UserResponseDto,
  AuthResponseDto
} = require('../dto/auth.dto');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  register = async (req, res, next) => {
    try {
      const registerDto = new RegisterRequestDto(req.body);
      
      const result = await this.authService.register(registerDto);
      
      // Set access token in HTTP-only cookie
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Return response with user data and refresh token
      const responseDto = new AuthResponseDto(result.user, result.tokens);
      
      return createdResponse(
        res,
        responseDto,
        'Registration successful! Please check your email to verify your account.'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   * POST /api/v1/auth/login
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

      // Return response with user data and refresh token
      const responseDto = new AuthResponseDto(result.user, result.tokens);
      
      return successResponse(
        res,
        responseDto,
        'Login successful!'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify email
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = async (req, res, next) => {
    try {
      const { token } = new EmailVerificationRequestDto(req.body);
      
      const user = await this.authService.verifyEmail(token);
      
      const userDto = new UserResponseDto(user);
      
      return successResponse(
        res,
        { user: userDto },
        'Email verified successfully! You can now access all features.'
      );
    } catch (error) {
      next(error);
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
   * Get current user
   * GET /api/v1/auth/me
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
   */
  checkAuthStatus = async (req, res, next) => {
    try {
      if (req.user) {
        const userDto = new UserResponseDto(req.user);
        return successResponse(
          res,
          { 
            isAuthenticated: true,
            user: userDto
          },
          'User is authenticated'
        );
      }
      
      return successResponse(
        res,
        { 
          isAuthenticated: false,
          user: null
        },
        'User is not authenticated'
      );
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AuthController;