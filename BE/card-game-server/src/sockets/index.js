const LobbySocketHandler = require('./Lobby.socket');
const GameSocketHandler = require('./Game.socket');
const { verifyAccessToken } = require('../utils/jwt.util');
const UserRepository = require('../repositories/user.repository');

const userRepository = new UserRepository();

/**
 * Socket.IO Initialization
 * No authentication at socket level - will verify user is in lobby when they join
 */
function initializeSockets(io) {
  console.log('✅ Socket.IO initialized without authentication middleware');
  console.log('ℹ️ User verification will happen when joining lobby rooms');

  // Initialize lobby socket handler
  const lobbySocketHandler = new LobbySocketHandler(io);
  lobbySocketHandler.initialize();

  // Initialize game socket handler
  const gameSocketHandler = new GameSocketHandler(io);
  gameSocketHandler.initialize();

  console.log('✅ Socket handlers initialized without authentication');
  
  return {
    lobbySocketHandler,
    gameSocketHandler
  };
}

module.exports = initializeSockets;