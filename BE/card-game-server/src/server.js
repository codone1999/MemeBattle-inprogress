import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { getDatabase } from './config/database.js';
import routes from './routes/index.js';
import lobbyRoutes from './routes/lobbyRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== CORS CONFIGURATION ====================
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// ==================== BODY PARSING MIDDLEWARE ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== REQUEST LOGGING ====================
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '***';
      console.log('Body:', JSON.stringify(sanitizedBody, null, 2));
    }
    
    next();
  });
}

// ==================== TRUST PROXY ====================
app.set('trust proxy', 1);

// ==================== API ROUTES (ORDER MATTERS!) ====================
// 1. Mount main API routes
app.use('/api', routes);

// 2. Mount lobby routes
app.use('/api/lobby', lobbyRoutes);

// ==================== ROOT ENDPOINT ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎮 Voyna of Meme - Card Game API',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        verify: 'GET /api/auth/verify'
      },
      user: {
        profile: 'GET /api/user/profile',
        inventory: 'GET /api/user/inventory',
        decks: 'GET /api/user/decks',
        cards: 'GET /api/user/cards',
        characters: 'GET /api/user/characters',
        maps: 'GET /api/user/maps',
        friends: 'GET /api/user/friends'
      },
      lobby: {
        list: 'GET /api/lobby/list',
        create: 'POST /api/lobby/create',
        join: 'POST /api/lobby/join',
        details: 'GET /api/lobby/:lobbyId',
        invites: 'GET /api/lobby/invites'
      }
    }
  });
});

// ==================== HEALTH CHECK ====================
app.get('/health', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.get('SELECT 1');
    
    res.json({ 
      success: true,
      status: 'OK', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      message: 'Service unavailable',
      error: error.message
    });
  }
});

// ==================== ERROR HANDLERS (MUST BE LAST!) ====================
app.use(notFoundHandler);
app.use(errorHandler);

// ==================== SERVER START ====================
async function startServer() {
  try {
    console.log('\n🚀 Starting Voyna of Meme Server...\n');

    const db = await getDatabase();
    console.log('✅ Database connected successfully');

    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    const cardCount = await db.get('SELECT COUNT(*) as count FROM cards');
    const characterCount = await db.get('SELECT COUNT(*) as count FROM characters');

    console.log('\n📊 Database Statistics:');
    console.log(`   Users: ${userCount.count}`);
    console.log(`   Cards: ${cardCount.count}`);
    console.log(`   Characters: ${characterCount.count}`);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n✨ Server started successfully!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Server URL:      http://localhost:${PORT}`);
      console.log(`🌍 Environment:     ${NODE_ENV}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log('\n📚 Available Routes:\n');
      console.log('   Authentication:');
      console.log('   ✓ POST   /api/auth/register');
      console.log('   ✓ POST   /api/auth/login');
      console.log('   ✓ GET    /api/auth/verify');
      
      console.log('\n   User & Inventory:');
      console.log('   ✓ GET    /api/user/profile');
      console.log('   ✓ GET    /api/user/inventory');
      console.log('   ✓ GET    /api/user/decks');
      console.log('   ✓ GET    /api/user/cards');
      console.log('   ✓ GET    /api/user/characters');
      console.log('   ✓ GET    /api/user/maps');
      
      console.log('\n   Friends:');
      console.log('   ✓ GET    /api/user/friends');
      console.log('   ✓ POST   /api/user/friend-request');
      console.log('   ✓ GET    /api/user/friend-requests');
      
      console.log('\n   Lobby System:');
      console.log('   ✓ POST   /api/lobby/create');
      console.log('   ✓ GET    /api/lobby/list');
      console.log('   ✓ GET    /api/lobby/:lobbyId');
      console.log('   ✓ POST   /api/lobby/join');
      console.log('   ✓ GET    /api/lobby/invites');
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Server ready to accept connections!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 ${signal} received. Shutting down...`);
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        try {
          await db.close();
          console.log('✅ Database connection closed');
        } catch (err) {
          console.error('❌ Error closing database:', err);
        }
        console.log('👋 Goodbye!\n');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('⚠️  Forcing shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;