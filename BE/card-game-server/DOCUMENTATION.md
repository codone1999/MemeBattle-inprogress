# Backend Documentation - MemeBattle Card Game

> Complete backend documentation for the Queen's Blood style card game
>
> Last Updated: 2025-12-13

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Character Ability System](#character-ability-system)
3. [Game Flow](#game-flow)
4. [API Reference](#api-reference)
5. [WebSocket Events](#websocket-events)
6. [Database Schema](#database-schema)
7. [Map System](#map-system)
8. [Recent Changes](#recent-changes)

---

## Project Structure

```
BE/card-game-server/
├── src/
│   ├── models/              # Mongoose schemas
│   │   ├── Character.model.js
│   │   ├── Card.model.js
│   │   ├── User.model.js
│   │   ├── Game.model.js
│   │   ├── Deck.model.js
│   │   ├── Map.model.js
│   │   └── Inventory.model.js
│   │
│   ├── repositories/        # Database access layer
│   │   ├── Character.repository.js
│   │   ├── Card.repository.js
│   │   ├── User.repository.js
│   │   └── ...
│   │
│   ├── services/            # Business logic
│   │   ├── Game.service.js  # Core game logic
│   │   ├── Lobby.service.js
│   │   ├── Gacha.service.js
│   │   └── ...
│   │
│   ├── routes/              # API endpoints
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Auth, validation
│   └── config/              # Configuration
│
├── DB/
│   └── mongodb-seed-data.js # Database seeding script
│
└── server.js                # Application entry point
```

---

## Character Ability System

### Overview

Characters provide passive bonuses that affect gameplay. Each character can have multiple abilities with different effect types.

### Supported Effect Types

#### 1. `pawnBoost` - Start of Game
- **When**: Applied at game initialization
- **Effect**: Increases starting pawns
- **Implementation**: `_applyStartGameAbility()` in `Game.service.js:943`

**Example:**
```javascript
{
  effectType: 'pawnBoost',
  value: 2,
  condition: 'start of game',
  target: 'User Board'
}
// Result: Player starts with 3 pawns per row (1 + 2)
```

#### 2. `debuffReduction` - Continuous
- **When**: During score calculation when debuffs are applied
- **Effect**: Reduces enemy debuff impact by percentage
- **Implementation**: `_getDebuffReduction()` in `Game.service.js:845`

**Example:**
```javascript
{
  effectType: 'debuffReduction',
  value: 0.75,
  condition: 'every time when debuff applied',
  target: 'User Board'
}
// Result: Enemy debuffs reduced by 75%
```

**Calculation:**
- Score Reduction: `-2` becomes `-0.5` (reduced by 75%)
- Multiplier: `0.7` becomes `0.925` (30% debuff → 7.5% debuff)

#### 3. `cardPowerBoost` - Passive/Continuous
- **When**: During score calculation
- **Effect**: Adds flat power to cards
- **Implementation**: `_applyCharacterAbilitiesToCard()` in `Game.service.js:802`

```javascript
{
  effectType: 'cardPowerBoost',
  value: 1,
  condition: 'pawn requirement is 1',
  target: 'your cards with pawn requirement 1'
}
```

#### 4. `scoreMultiplier` - Passive/Continuous
- **When**: During score calculation
- **Effect**: Multiplies card power
- **Implementation**: `_applyCharacterAbilitiesToCard()` in `Game.service.js:802`

```javascript
{
  effectType: 'scoreMultiplier',
  value: 2,
  condition: 'control 3+ rows',
  target: 'all your cards'
}
```

#### 5-7. Future Effect Types
- `extraDraw` - Draw additional cards
- `placementBonus` - Extended ability ranges
- `specialCondition` - Custom unique effects

### Ability Types

- **passive**: Always active, no trigger
- **triggered**: Active when condition met
- **continuous**: Ongoing effect throughout game

### Example Character: Aerith Gainsborough

```javascript
{
  name: 'aerith gainsborough',
  rarity: 'legendary',
  abilities: {
    skillName: 'Arcane Ward',
    skillDescription: 'Automatic started with 3 pawn row',
    abilityType: 'passive',
    effects: [
      {
        effectType: 'pawnBoost',
        value: 2,
        condition: 'start of game',
        target: 'User Board'
      },
      {
        effectType: 'debuffReduction',
        value: 0.75,
        condition: 'every time when debuff applied',
        target: 'User Board'
      }
    ]
  }
}
```

**How It Works:**
1. **Game Start:** Player starts with 3 pawns per row
2. **Enemy Debuffs:** All debuffs reduced by 75%
   - Enemy plays `-2` debuff → You lose `-0.5`
   - Enemy plays `0.7×` multiplier → You get `0.925×`

### Implementation Flow

```javascript
// Score Calculation with Character Abilities
For each card on board:
  1. Get base card power
  2. Apply character abilities (cardPowerBoost, scoreMultiplier)
     - _applyCharacterAbilitiesToCard()
  3. Get debuff reduction from character
     - _getDebuffReduction()
  4. Apply card abilities (buff/debuff) with reduction
  5. Add to row score
```

### Code References

| Feature | Method | Line |
|---------|--------|------|
| Game Start Pawns | `_initializeBoard()` | 896 |
| Start Game Ability | `_applyStartGameAbility()` | 943 |
| Score Calculation | `_calculateScores()` | 724 |
| Character Abilities | `_applyCharacterAbilitiesToCard()` | 802 |
| Debuff Reduction | `_getDebuffReduction()` | 845 |
| Condition Checking | `_checkAbilityCondition()` | 867 |

---

## Game Flow

### Game Phases

1. **Lobby Phase**
   - Player creates/joins lobby
   - Selects map, deck, character
   - Marks ready when prepared
   - Game starts when both players ready

2. **Dice Roll Phase**
   - Both players roll 2 dice (1-6 each)
   - Higher total goes first
   - Tie triggers re-roll
   - Phase: `dice_roll`

3. **Playing Phase**
   - Players alternate turns
   - Current player can:
     - **Play Card**: Place card on valid square
     - **Skip Turn**: Draw 1 card (max 3 consecutive skips)
   - Phase: `playing`

4. **End Phase**
   - Game ends when both players out of cards
   - Scores calculated
   - Winner determined
   - Coins awarded to winner
   - Phase: `ended`

### Game State (Redis)

```javascript
{
  gameId: String,
  lobbyId: String,
  mapId: String,
  status: String, // 'dice_roll', 'playing', 'completed'
  phase: String,
  currentTurn: String (userId),
  turnNumber: Number,

  players: {
    [userId]: {
      userId: String,
      username: String,
      character: Object,
      hand: [Card],
      deck: [cardId],
      totalScore: Number,
      rowScores: [0, 0, 0],
      consecutiveSkips: Number
    }
  },

  board: [
    [Square, Square, ...], // Row 0
    [Square, Square, ...], // Row 1
    [Square, Square, ...]  // Row 2
  ]
}
```

### Board Structure

```javascript
Square: {
  x: Number,
  y: Number,
  card: Card | null,
  owner: userId | null,
  pawns: { [userId]: pawnCount },
  special: null, // No longer used
  abilityLocations: [{ x, y }] // Buff/debuff effect locations
}
```

---

## API Reference

### Authentication

#### POST `/api/auth/register`
Register new user

**Request:**
```json
{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123",
  "displayName": "Player One"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "uid": "...",
    "username": "player1",
    "email": "player1@example.com",
    "displayName": "Player One"
  }
}
```

#### POST `/api/auth/login`
Login user

**Request:**
```json
{
  "email": "player1@example.com",
  "password": "password123"
}
```

### Lobby API

#### POST `/api/lobbies`
Create new lobby

**Request:**
```json
{
  "mapId": "map_object_id",
  "gameSettings": {
    "turnTimeLimit": 60,
    "allowSpectators": false
  }
}
```

#### GET `/api/lobbies`
Get all active lobbies

#### POST `/api/lobbies/:lobbyId/join`
Join lobby

#### POST `/api/lobbies/:lobbyId/ready`
Mark player as ready

### Game API

#### GET `/api/games/:gameId`
Get game state

#### POST `/api/games/:gameId/play-card`
Play a card (also available via WebSocket)

#### POST `/api/games/:gameId/skip-turn`
Skip turn (also available via WebSocket)

### Card/Deck API

#### GET `/api/cards`
Get all cards

#### GET `/api/characters`
Get all characters

#### GET `/api/inventory/:userId`
Get user inventory

#### POST `/api/decks`
Create new deck

#### GET `/api/decks/:userId`
Get user's decks

---

## WebSocket Events

### Client → Server

#### `joinLobby`
```javascript
socket.emit('joinLobby', { lobbyId })
```

#### `setDeck`
```javascript
socket.emit('setDeck', { lobbyId, deckId })
```

#### `setCharacter`
```javascript
socket.emit('setCharacter', { lobbyId, characterId })
```

#### `markReady`
```javascript
socket.emit('markReady', { lobbyId })
```

#### `rollDice`
```javascript
socket.emit('rollDice', { gameId })
```

#### `playCard`
```javascript
socket.emit('playCard', {
  gameId,
  cardId,
  handCardIndex,
  x,
  y
})
```

#### `skipTurn`
```javascript
socket.emit('skipTurn', { gameId })
```

#### `leaveLobby`
```javascript
socket.emit('leaveLobby', { lobbyId })
```

### Server → Client

#### `lobbyUpdate`
Sent when lobby state changes
```javascript
{
  lobby: LobbyObject
}
```

#### `gameStarted`
Sent when game begins
```javascript
{
  gameId,
  gameState
}
```

#### `diceRollResult`
Sent after dice roll
```javascript
{
  type: 'result' | 'tie' | 'wait',
  playerA_roll,
  playerB_roll,
  firstTurn: userId,
  message
}
```

#### `gameStateUpdate`
Sent after each game action
```javascript
{
  gameState: GameState
}
```

#### `gameEnded`
Sent when game completes
```javascript
{
  winner: userId,
  finalScores: {...},
  reason: 'normal' | 'total_skips' | 'abandoned'
}
```

#### `error`
Sent when error occurs
```javascript
{
  message: String
}
```

---

## Database Schema

### Character Model

```javascript
{
  name: String (required),
  characterPic: String (required),
  rarity: String (required, enum: ['common', 'rare', 'epic', 'legendary']),
  description: String,
  abilities: {
    skillName: String,
    skillDescription: String,
    abilityType: String (enum: ['passive', 'triggered', 'continuous']),
    effects: [{
      effectType: String (enum: [
        'pawnBoost',
        'scoreMultiplier',
        'cardPowerBoost',
        'extraDraw',
        'placementBonus',
        'specialCondition',
        'debuffReduction'
      ]),
      value: Number,
      condition: String,
      target: String
    }]
  },
  timestamps: true
}
```

### Card Model

```javascript
{
  name: String (required),
  power: Number (required),
  rarity: String (required, enum: ['common', 'rare', 'epic', 'legendary']),
  cardType: String (required, enum: ['standard', 'buff', 'debuff']),
  pawnRequirement: Number (required),
  pawnLocations: [{
    relativeX: Number,
    relativeY: Number,
    pawnCount: Number (default: 1)
  }],
  ability: {
    abilityDescription: String,
    abilityLocations: [{
      relativeX: Number,
      relativeY: Number
    }],
    effectType: String (enum: ['scoreBoost', 'scoreReduction', 'multiplier']),
    effectValue: Number
  },
  cardInfo: String,
  cardImage: String,
  timestamps: true
}
```

### Map Model

```javascript
{
  name: String (required),
  image: String (required),
  themeColor: String,
  gridSize: {
    width: Number (default: 6),
    height: Number (default: 3)
  },
  specialSquares: [] (empty - no longer used),
  difficulty: String (enum: ['easy', 'medium', 'hard', 'expert']),
  timestamps: { createdAt: true, updatedAt: false }
}
```

---

## Map System

### Current Configuration (2025-12-13)

All maps now use standardized **3 rows × 6 columns** grid.

**Map Layout:**
```
     Column:  0   1   2   3   4   5
Row 0:      [P1] [ ] [ ] [ ] [ ] [P2]
Row 1:      [P1] [ ] [ ] [ ] [ ] [P2]
Row 2:      [P1] [ ] [ ] [ ] [ ] [P2]
```

- Player A (home): Starts on column 0
- Player B (away): Starts on column 5
- Total: 18 squares

### Available Maps

1. **Starter Arena**
   - Difficulty: easy
   - Theme: Green (#4CAF50)

2. **Tactical Battlefield**
   - Difficulty: medium
   - Theme: Red (#FF5722)

3. **Strategic Colosseum**
   - Difficulty: hard
   - Theme: Blue (#2196F3)

4. **Grandmaster's Court**
   - Difficulty: expert
   - Theme: Purple (#9C27B0)

### Special Squares

**Removed as of 2025-12-13**

All special squares removed. Buffs and debuffs now only come from:
- Character abilities
- Card abilities

Benefits:
- Simpler gameplay
- Better balance
- Focus on strategy
- Improved performance

---

## Recent Changes

### 2025-12-13: Character Ability System

**Added:**
- `debuffReduction` effect type
- Multi-ability support for characters
- Comprehensive ability system implementation

**Modified:**
- `Character.model.js` - Added `debuffReduction` to enum
- `Game.service.js` - Enhanced score calculation with character abilities
- `mongodb-seed-data.js` - Updated Aerith with dual abilities

**Files Changed:**
- [Character.model.js](src/models/Character.model.js#L35)
- [Game.service.js](src/services/Game.service.js#L724-L896)
- [mongodb-seed-data.js](DB/mongodb-seed-data.js#L165-L190)

### 2025-12-13: Map System Simplification

**Changed:**
- All maps: 3×6 grid (standardized)
- Removed all `specialSquares`
- Updated default board dimensions

**Benefits:**
- 18 squares vs 27-45 (better performance)
- Balanced gameplay
- Character/card focus

**Files Changed:**
- [mongodb-seed-data.js](DB/mongodb-seed-data.js#L1297-L1346)
- [Game.service.js](src/services/Game.service.js#L898) - Default width
- [Game.service.js](src/services/Game.service.js#L161) - Comment update

---

## Development Notes

### Testing Character Abilities

1. Create game with character that has abilities
2. Check console for ability application:
   ```
   ✨ Player A (aerith gainsborough) ability applied: 1 → 3 starting pawns
   ```
3. Test debuff reduction by having enemy play debuff cards
4. Verify score calculation

### Adding New Effect Types

1. Add to `Character.model.js` enum (line 35)
2. Implement logic in `Game.service.js`:
   - Start game effects: `_applyStartGameAbility()`
   - Continuous effects: `_applyCharacterAbilitiesToCard()`
   - Special effects: Add new method
3. Update seed data with example characters
4. Test thoroughly

### Database Seeding

```bash
cd BE/card-game-server/DB
mongosh mongodb://localhost:27017/board_game_db < mongodb-seed-data.js
```

Includes:
- 9 characters (8 + Aerith with dual abilities)
- 50 cards (20 standard, 15 buff, 15 debuff)
- 4 maps (all 3×6, no special squares)
- Test user with inventory and deck

---

## Environment Variables

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/board_game_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key_here

# Server
PORT=3000

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## License

[Your License Here]

---

*Documentation maintained by backend development team*
*Last Updated: 2025-12-13*
