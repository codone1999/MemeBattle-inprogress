const { Server } = require('socket.io');
const SocketLobbyHandler = require('./Lobby.socket');

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} - Socket.IO server instance
 */
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Create lobby handler
  const lobbyHandler = new SocketLobbyHandler(io);

  // Handle socket connections
  io.on('connection', (socket) => {
    lobbyHandler.handleConnection(socket);
  });

  console.log('Socket.IO server initialized');

  return { io, lobbyHandler };
};

module.exports = { initializeSocket };