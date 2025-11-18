const LobbySocketHandler = require('./Lobby.socket');
const GameSocketHandler = require('./Game.socket');
const { verifyAccessToken } = require('../utils/jwt.util');
const UserRepository = require('../repositories/user.repository');

const userRepository = new UserRepository();

/**
 * Socket.IO Initialization
 * Sets up all socket handlers with authentication
 */
function initializeSockets(io) {
  // Middleware to authenticate sockets
  io.use(async (socket, next) => {
    try {
      // Get token from auth object or query
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        console.error('❌ Socket connection without token');
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (error) {
        console.error('❌ Invalid socket token:', error.message);
        return next(new Error('Invalid or expired token'));
      }

      // Verify user exists in database
      const user = await userRepository.findById(decoded.userId);
      
      if (!user) {
        console.error(`❌ User ${decoded.userId} not found in database`);
        return next(new Error('User not found'));
      }

      // Attach user info to socket
      socket.userId = decoded.userId;
      socket.userUid = user.uid;
      socket.username = user.username;
      socket.displayName = user.displayName;

      console.log(`✅ Socket authenticated: ${user.username} (${user.uid})`);
      
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle connection errors
  io.on('connection_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  // Initialize lobby socket handler
  const lobbySocketHandler = new LobbySocketHandler(io);
  lobbySocketHandler.initialize();

  // Initialize game socket handler
  const gameSocketHandler = new GameSocketHandler(io);
  gameSocketHandler.initialize();

  console.log('✅ Socket handlers initialized with authentication');
  
  return {
    lobbySocketHandler,
    gameSocketHandler
  };
}

module.exports = initializeSockets;