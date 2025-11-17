##Socket Events##
1.Send to Server
    socket.emit('lobby:leave', {});
    socket.emit('lobby:select:deck', { deckId });
    socket.emit('lobby:update:settings', { lobbyName, mapId });
    socket.emit('lobby:kick:player', { playerId });
    socket.emit('lobby:start:game', {});
    socket.emit('lobby:ready:toggle', { isReady: true });
2.Receive from Server
    socket.on('lobby:state:update', (lobby) => {}); 
    socket.on('lobby:reconnected', (data) => {});
    socket.on('lobby:kicked', (data) => {});
    socket.on('lobby:closed', (data) => {});
    socket.on('game:starting', (data) => {});
    socket.on('error', (error) => {});
3.Lobby List Updates (Global)
    socket.on('lobbyList:lobby:created', (lobby) => {});
    socket.on('lobbyList:lobby:updated', (update) => {});
    socket.on('lobbyList:lobby:deleted', (data) => {});
    socket.on('lobbyList:lobby:started', (data) => {});

Client Request
    ↓
Route (routes/)
    ↓
Middleware (auth, validation)
    ↓
Controller (controllers/)
    ↓
Service (services/)
    ↓
Repository (repositories/)
    ↓
MongoDB (models/)

**Socket Event Flow Architecture**
Client Emit Event
        ↓
Socket Event Handler (socketHandlers/)
        ↓
Middleware (optional: auth, validation)
        ↓
Socket Controller (controllers/socket/)
        ↓
Service (services/)
        ↓
Repository (repositories/)
        ↓
MongoDB (models/)


backend/
├── src/
│   ├── config/              # Configuration
│   │   ├── database.js      # MongoDB connection
│   │   ├── mongoPool.js     # pre-established database connections keeps open and reuses
│   │   └── email.js         # Email setup
│   ├── constants/        
│   │   └── starter-pack.js
│   ├── controllers/         # HTTP handlers
│   │   ├── auth.controller.js 
│   │   ├── Deck.controller.js    
│   │   ├── friend.controller.js 
│   │   ├── inventory.controller.js       
│   │   ├── Lobby.controller.js   
│   │   └── user.controller.js
│   ├── services/            # Business logic
│   │   ├── auth.service.js
│   │   ├── Deck.service.js
│   │   ├── email.service.js
│   │   ├── friend.service.js
│   │   ├── inventory.service.js
│   │   ├── Lobby.service.js
│   │   └── user.service.js
│   ├── repositories/        # Database operations
│   │   ├── Deck.repository.js
│   │   ├── emailVerification.repository.js
│   │   ├── friendRequest.repository.js
│   │   ├── inventory.repository.js
│   │   ├── Lobby.repository.js
│   │   └── user.repository.js
│   ├── models/              # Mongoose schemas
│   │   ├── Card.model.js
│   │   ├── Character.model.js
│   │   ├── Deck.model.js
│   │   ├── EmailVerification.model.js
│   │   ├── FriendRequest.model.js
│   │   ├── Gamelobby.model.js
│   │   ├── Inventory.model.js
│   │   ├── Map.model.js
│   │   └── User.model.js
│   ├── dto/                 # Data validation
│   │   ├── auth.dto.js
│   │   ├── deck.dto.js
│   │   ├── friend.dto.js
│   │   ├── inventory.dto.js
│   │   ├── Lobby.dto.js
│   │   └── validation/
│   │   |   ├── auth.validation.js
│   │   |   ├── Deck.validation.js
│   │   |   ├── friend.validation.js
│   │   |   ├── inventory.validation.js
│   │   |   ├── Lobby.validation.js
│   │   |   └── user.validation.js
│   ├── middlewares/         # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── utils/               # Utilities
│   │   ├── jwt.util.js
│   │   ├── password.util.js
│   │   └── response.util.js
│   ├── constants/
│   │   └── starter-pack.js
│   ├── routes/
│   │   └── auth.routes.js
│   └── app.js
├── .env                     # Environment variables
├── server.js                # Entry point
├── package.json
└── README.md
