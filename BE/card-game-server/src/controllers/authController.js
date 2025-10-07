import { authService } from '../services/authService.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { username, password, email } = req.body;
      const result = await authService.register({ username, password, email });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await authService.login({ username, password });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.uid);
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyToken(req, res, next) {
    try {
      const user = await authService.verifySession(req.user.uid);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
};