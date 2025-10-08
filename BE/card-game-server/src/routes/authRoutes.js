import express from 'express';
import { authController } from '../controllers/authController.js';
import { registerValidation, loginValidation, validate } from '../utils/validators.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/refresh', authController.refreshToken); // New route

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/verify', authMiddleware, authController.verifyToken);

export default router;