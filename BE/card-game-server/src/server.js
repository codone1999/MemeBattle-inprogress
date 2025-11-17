require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose')
const app = require('./app.js');
const { connectDatabase } = require('./config/database.js');
const { initializeSocket } = require('./sockets');
const LobbyListBroadcaster = require('./sockets/Lobbylist.broadcast.js');
const lobbyController = require('./controllers/Lobby.controller.js');

const PORT = process.env.PORT || 3000;

// 1. Create HTTP Server (Required for Socket.IO to share the port)
const server = http.createServer(app);
// 2. Initialize Socket.IO
const { io, lobbyHandler } = initializeSocket(server);

// 3. Initialize Broadcasters
const lobbyListBroadcaster = new LobbyListBroadcaster(io);

// 4. Dependency Injection
// We inject the socket capabilities into the controller here, 
// so the routes in app.js (which use this controller) can access them.
if (lobbyController.setSocketHandler) {
    lobbyController.setSocketHandler(lobbyHandler);
}
if (lobbyController.setLobbyListBroadcaster) {
    lobbyController.setLobbyListBroadcaster(lobbyListBroadcaster);
}

// 5. Start Server Function
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start listening
    server.listen(PORT, () => {
      console.log('\n========================================');
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 API URL: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
      console.log(`🔌 Socket.IO active on port ${PORT}`);
      console.log('========================================\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// 6. Graceful Shutdown Logic
const gracefulShutdown = async () => {
  console.log('\nShutting down gracefully...');
  
  try {
    // Close Socket.IO
    if (io) {
        io.close(() => console.log('✓ Socket.IO connections closed'));
    }

    // Close MongoDB
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');

    // Close HTTP server
    server.close(() => {
      console.log('✓ HTTP server closed');
      process.exit(0);
    });

    // Force close if it takes too long
    setTimeout(() => {
      console.error('✗ Could not close connections in time, forcing shutdown');
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('✗ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

startServer();