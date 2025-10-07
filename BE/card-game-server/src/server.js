import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { getDatabase } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== CORS CONFIGURATION (MUST BE BEFORE OTHER MIDDLEWARE) ====================
// Allow all origins in development for easier debugging
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      callback(null, true); // Allow in development, block in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

// Enable CORS with options
app.use(cors(corsOptions));

// Handle preflight requests explicitly
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

// ==================== REQUEST LOGGING MIDDLEWARE ====================
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
    
    // Log request body for POST/PUT/PATCH (excluding passwords)
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

// ==================== API ROUTES ====================
app.use('/api', routes);

// ==================== ROOT ENDPOINT ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎮 Voyna of Meme - Card Game API',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    cors: 'enabled',
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
        updateInventory: 'PUT /api/user/inventory',
        cards: 'GET /api/user/cards',
        characters: 'GET /api/user/characters',
        maps: 'GET /api/user/maps'
      },
      decks: {
        list: 'GET /api/user/decks',
        create: 'POST /api/user/decks',
        update: 'PUT /api/user/decks/:deckid',
        delete: 'DELETE /api/user/decks/:deckid'
      }
    }
  });
});

// ==================== HEALTH CHECK ENDPOINT ====================
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
      cors: 'enabled',
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

// ==================== API INFO ENDPOINT ====================
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Voyna of Meme API',
    version: '1.0.0',
    cors: 'enabled',
    routes: {
      auth: '/api/auth',
      user: '/api/user'
    }
  });
});

// ==================== 404 HANDLER ====================
app.use(notFoundHandler);

// ==================== ERROR HANDLER ====================
app.use(errorHandler);

// ==================== DATABASE INITIALIZATION & SERVER START ====================
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

    if (userCount.count === 0 || cardCount.count === 0) {
      console.log('\n⚠️  Warning: Database appears empty!');
      console.log('   Run: npm run init-db');
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n✨ Server started successfully!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Server URL:      http://localhost:${PORT}`);
      console.log(`📡 Network URL:     http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment:     ${NODE_ENV}`);
      console.log(`🔐 JWT Secret:      ${process.env.JWT_SECRET ? '✓ Set' : '✗ NOT SET (CRITICAL!)'}`);
      console.log(`📁 Database Path:   ${process.env.DATABASE_PATH || './game.db'}`);
      console.log(`🌐 CORS:            ✓ Enabled for localhost:5173`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log('\n📚 Available API Endpoints:\n');
      console.log('   Authentication:');
      console.log('   POST   /api/auth/register     - Register new user');
      console.log('   POST   /api/auth/login        - Login user');
      console.log('   POST   /api/auth/logout       - Logout user');
      console.log('   GET    /api/auth/verify       - Verify token');
      
      console.log('\n   User Management:');
      console.log('   GET    /api/user/profile      - Get user profile');
      console.log('   GET    /api/user/inventory    - Get user inventory');
      console.log('   PUT    /api/user/inventory    - Update inventory');
      
      console.log('\n   Deck Management:');
      console.log('   GET    /api/user/decks        - Get user decks');
      console.log('   POST   /api/user/decks        - Create new deck');
      console.log('   PUT    /api/user/decks/:id    - Update deck');
      console.log('   DELETE /api/user/decks/:id    - Delete deck');
      
      console.log('\n   Game Data:');
      console.log('   GET    /api/user/cards        - Get all cards');
      console.log('   GET    /api/user/characters   - Get all characters');
      console.log('   GET    /api/user/maps         - Get all maps');
      
      console.log('\n   Utility:');
      console.log('   GET    /                      - API information');
      console.log('   GET    /health                - Health check');
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Server is ready to accept connections!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-this')) {
        console.log('⚠️  WARNING: Please set a strong JWT_SECRET in .env file!');
        console.log('   Current secret is either missing or using default value.\n');
      }
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 ${signal} received. Starting graceful shutdown...`);
      
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
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    console.error('\nError Details:');
    console.error(error.stack);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure database exists: npm run init-db');
    console.error('   2. Check .env file configuration');
    console.error('   3. Verify all dependencies are installed: npm install');
    console.error('   4. Check if port is already in use\n');
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  console.error('\nStack:', reason?.stack);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

startServer();

export default app;