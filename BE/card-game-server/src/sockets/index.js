const LobbySocketHandler = require('./Lobby.socket');
const GameSocketHandler = require('./Game.socket');
const { verifyAccessToken } = require('../utils/jwt.util');
const UserRepository = require('../repositories/user.repository');

const userRepository = new UserRepository();

/**
 * Socket.IO Initialization with Authentication
 * Verifies userId from socket auth and attaches it to the socket
 */
function initializeSockets(io) {
  // Add authentication middleware
  io.use(async (socket, next) => {
    try {
      // Get userId from socket auth (sent from frontend)
      const userId = socket.handshake.auth?.userId;

      if (!userId) {
        console.error('Socket connection without userId');
        return next(new Error('Authentication required: userId missing'));
      }

      // Verify user exists in database
      const user = await userRepository.findById(userId);

      if (!user) {
        console.error(`Socket connection with invalid userId: ${userId}`);
        return next(new Error('Authentication failed: User not found'));
      }

      // Attach userId to socket for use in handlers
      socket.userId = userId.toString();

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Authentication failed'));
    }
  });


  // Initialize lobby socket handler
  const lobbySocketHandler = new LobbySocketHandler(io);
  lobbySocketHandler.initialize();

  // Initialize game socket handler
  const gameSocketHandler = new GameSocketHandler(io);
  gameSocketHandler.initialize();


  return {
    lobbySocketHandler,
    gameSocketHandler
  };
}

module.exports = initializeSockets;