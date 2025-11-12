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
   * Note: Does NOT set access token - user must verify email first
   */
  register = async (req, res, next) => {
    try {
      const registerDto = new RegisterRequestDto(req.body);
      
      const result = await this.authService.register(registerDto);
      
      // DO NOT set access token on registration
      // User must verify email first, then login
      
      // Return response with user data only (no tokens)
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
   * Sets access token in cookie after successful login
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
        'Email verified successfully! You can now login to access all features.'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify email from query parameter (for email links)
   * GET /api/v1/auth/verify-email?token=xxx
   */
  verifyEmailFromQuery = async (req, res, next) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return badRequestResponse(
          res,
          'Verification token is required',
          [{ field: 'token', message: 'Token must be provided in query parameter' }]
        );
      }

      const user = await this.authService.verifyEmail(token);
      
      const userDto = new UserResponseDto(user);
      
      // Return HTML response for better UX when clicking email link
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #667eea;
              margin-bottom: 20px;
            }
            .success-icon {
              font-size: 60px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
              font-weight: bold;
            }
            .button:hover {
              background: #764ba2;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Email Verified!</h1>
            <p>Your email has been successfully verified.</p>
            <p><strong>Welcome, ${userDto.displayName}!</strong></p>
            <p>You can now login to access all features.</p>
            <a href="${process.env.FRONTEND_URL}/login" class="button">Go to Login</a>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      // Return HTML error page
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #e74c3c;
              margin-bottom: 20px;
            }
            .error-icon {
              font-size: 60px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1>Verification Failed</h1>
            <p>${error.message || 'Invalid or expired verification token'}</p>
            <a href="${process.env.FRONTEND_URL}/resend-verification" class="button">Resend Email</a>
          </div>
        </body>
        </html>
      `);
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