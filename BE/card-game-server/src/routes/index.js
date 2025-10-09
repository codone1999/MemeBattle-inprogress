import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

// Health check for API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Voyna of Meme API',
    version: '1.0.0',
    routes: {
      auth: '/api/auth',
      user: '/api/user',
      lobby: '/api/lobby'
    }
  });
});

export default router;