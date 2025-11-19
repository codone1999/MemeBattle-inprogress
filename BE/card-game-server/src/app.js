const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

// Routes
const authRoutes = require('./routes/auth.routes.js');
const deckRoutes = require('./routes/deck.routes.js');
const inventoryRoutes = require('./routes/inventory.routes.js');
const friendRoutes = require('./routes/friend.routes.js');
const userRoutes = require('./routes/user.routes.js');
const lobbyRoutes = require('./routes/Lobby.routes.js');
const gameRoutes = require('./routes/game.routes.js');
const gachaRoutes = require('./routes/gacha.routes.js')
// Middlewares
const errorHandler = require('./middlewares/errorHandler.middleware.js');

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false // Often needed for game sockets/assets
}));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser());

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';

// Proper template literal syntax with parentheses
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/decks`, deckRoutes);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/friends`, friendRoutes);
app.use(`/api/${API_VERSION}/lobbies`, lobbyRoutes);
app.use(`/api/${API_VERSION}/games`, gameRoutes);
app.use(`/api/${API_VERSION}/gacha`, gachaRoutes)

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error Handler (must be last)
app.use(errorHandler);

module.exports = app;