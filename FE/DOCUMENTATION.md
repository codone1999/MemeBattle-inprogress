# Frontend Documentation - MemeBattle Card Game

> Complete frontend documentation for the Queen's Blood style card game
>
> Last Updated: 2025-12-13

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Components](#components)
3. [Services](#services)
4. [State Management](#state-management)
5. [WebSocket Integration](#websocket-integration)
6. [Styling Guide](#styling-guide)
7. [Image Assets](#image-assets)
8. [Migration Guide](#migration-guide)

---

## Project Structure

```
FE/
├── public/
│   ├── cards/               # Card images
│   ├── characters/          # Character images
│   ├── maps/                # Map backgrounds
│   └── avatars/             # User profile pictures
│
├── src/
│   ├── components/
│   │   ├── MainGame/        # Game board components
│   │   │   ├── MainGame.jsx
│   │   │   ├── GameBoard.jsx
│   │   │   ├── CardHand.jsx
│   │   │   └── PlayerInfo.jsx
│   │   │
│   │   ├── MainLobby/       # Lobby system
│   │   │   ├── MainLobby.jsx
│   │   │   ├── LobbyRoom.jsx
│   │   │   ├── DeckSelector.jsx
│   │   │   └── CharacterSelector.jsx
│   │   │
│   │   ├── Auth/            # Authentication
│   │   ├── Inventory/       # Card collection
│   │   └── Common/          # Shared components
│   │
│   ├── services/            # API calls
│   │   ├── api.js
│   │   └── socket.js
│   │
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Helper functions
│   └── App.jsx              # Main application
│
└── package.json
```

---

## Components

### MainGame Component

Main game board rendering and interaction.

**Key Files:**
- `MainGame.jsx` - Game container, handles WebSocket events
- `GameBoard.jsx` - 3×6 grid rendering
- `CardHand.jsx` - Player's hand display
- `PlayerInfo.jsx` - Character and stats display

**Props:**
```javascript
<MainGame
  gameId={string}
  userId={string}
/>
```

**State:**
```javascript
{
  gameState: Object,
  selectedCard: Card | null,
  hoveredSquare: {x, y} | null,
  isMyTurn: boolean
}
```

**Key Functions:**
```javascript
handleCardSelect(card, index)
handleSquareClick(x, y)
handleSkipTurn()
```

### GameBoard Component

Renders the 3×6 game board grid.

**Grid Structure:**
```jsx
<div className="game-board">
  {board.map((row, y) => (
    <div className="board-row" key={y}>
      {row.map((square, x) => (
        <Square
          key={`${x}-${y}`}
          square={square}
          isHighlighted={...}
          onClick={() => handleClick(x, y)}
        />
      ))}
    </div>
  ))}
</div>
```

**Board Layout:**
```
Row 0: [P1] [ ] [ ] [ ] [ ] [P2]
Row 1: [P1] [ ] [ ] [ ] [ ] [P2]
Row 2: [P1] [ ] [ ] [ ] [ ] [P2]
```

### CardHand Component

Displays player's cards in hand.

**Features:**
- Hover effects
- Card selection
- Pawn requirement indicators
- Card type badges (standard/buff/debuff)

**Example:**
```jsx
<CardHand
  cards={player.hand}
  selectedIndex={selectedCardIndex}
  onCardSelect={handleCardSelect}
/>
```

### MainLobby Component

Lobby list and matchmaking system.

**Features:**
- Create new lobby
- Join existing lobby
- Deck selection
- Character selection
- Ready status

**Flow:**
1. User creates or joins lobby
2. Selects deck from inventory
3. Selects character
4. Marks ready
5. Game starts when both players ready

### DeckSelector Component

Deck selection interface.

**Props:**
```javascript
<DeckSelector
  userId={string}
  onDeckSelect={(deckId) => void}
  selectedDeckId={string | null}
/>
```

**Features:**
- Display user's decks
- Show deck card count
- Highlight selected deck
- Create new deck button

### CharacterSelector Component

Character selection interface.

**Props:**
```javascript
<CharacterSelector
  characters={Array}
  onCharacterSelect={(characterId) => void}
  selectedCharacterId={string | null}
/>
```

**Display:**
- Character image
- Character name
- Rarity badge
- Ability description
- Selection indicator

---

## Services

### API Service

Handles all HTTP requests to backend.

**File:** `src/services/api.js`

**Methods:**
```javascript
// Auth
api.register(data)
api.login(credentials)

// Game
api.getLobbies()
api.createLobby(data)
api.joinLobby(lobbyId)

// Cards & Decks
api.getCards()
api.getCharacters()
api.getInventory(userId)
api.getDecks(userId)
api.createDeck(data)

// User
api.getUserProfile(userId)
api.updateProfile(data)
```

**Example:**
```javascript
import api from './services/api';

const lobbies = await api.getLobbies();
const myDecks = await api.getDecks(userId);
```

### Socket Service

WebSocket connection management.

**File:** `src/services/socket.js`

**Setup:**
```javascript
import io from 'socket.io-client';

const socket = io(REACT_APP_SOCKET_URL, {
  auth: { token: localStorage.getItem('token') }
});

export default socket;
```

**Usage:**
```javascript
import socket from './services/socket';

// Emit events
socket.emit('joinLobby', { lobbyId });
socket.emit('playCard', { gameId, cardId, x, y });

// Listen to events
socket.on('gameStateUpdate', (data) => {
  setGameState(data.gameState);
});
```

---

## State Management

### Game State

Managed locally in MainGame component.

```javascript
const [gameState, setGameState] = useState({
  gameId: string,
  phase: 'dice_roll' | 'playing' | 'ended',
  currentTurn: userId,
  board: [[Square]],
  players: {
    [userId]: {
      character: Character,
      hand: [Card],
      totalScore: number,
      rowScores: [number, number, number]
    }
  }
});
```

### Lobby State

```javascript
const [lobby, setLobby] = useState({
  lobbyId: string,
  host: userId,
  players: [
    {
      userId: string,
      username: string,
      deckId: string | null,
      characterId: string | null,
      isReady: boolean
    }
  ],
  mapId: string,
  status: 'waiting' | 'ready' | 'started'
});
```

### User State

Managed globally (Context/Redux).

```javascript
const [user, setUser] = useState({
  uid: string,
  username: string,
  displayName: string,
  coins: number,
  stats: {
    totalGames: number,
    wins: number,
    losses: number,
    winRate: number
  }
});
```

---

## WebSocket Integration

### Connection Setup

```javascript
useEffect(() => {
  socket.connect();

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected');
  });

  return () => {
    socket.disconnect();
  };
}, []);
```

### Event Handlers

```javascript
useEffect(() => {
  socket.on('lobbyUpdate', handleLobbyUpdate);
  socket.on('gameStarted', handleGameStarted);
  socket.on('gameStateUpdate', handleGameStateUpdate);
  socket.on('diceRollResult', handleDiceRollResult);
  socket.on('gameEnded', handleGameEnded);
  socket.on('error', handleError);

  return () => {
    socket.off('lobbyUpdate');
    socket.off('gameStarted');
    socket.off('gameStateUpdate');
    socket.off('diceRollResult');
    socket.off('gameEnded');
    socket.off('error');
  };
}, []);
```

### Emitting Events

```javascript
const playCard = (cardId, handCardIndex, x, y) => {
  socket.emit('playCard', {
    gameId,
    cardId,
    handCardIndex,
    x,
    y
  });
};

const skipTurn = () => {
  socket.emit('skipTurn', { gameId });
};

const rollDice = () => {
  socket.emit('rollDice', { gameId });
};
```

---

## Styling Guide

### CSS Organization

```
components/
├── MainGame/
│   ├── MainGame.jsx
│   ├── MainGame.css
│   ├── GameBoard.jsx
│   └── GameBoard.css
```

### Theme Variables

```css
:root {
  /* Colors */
  --primary-color: #4CAF50;
  --secondary-color: #FF5722;
  --background: #1a1a1a;
  --card-bg: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;

  /* Rarity Colors */
  --rarity-common: #9e9e9e;
  --rarity-rare: #2196f3;
  --rarity-epic: #9c27b0;
  --rarity-legendary: #ff9800;

  /* Board */
  --square-size: 80px;
  --square-gap: 4px;
}
```

### Board Styling

```css
.game-board {
  display: grid;
  grid-template-rows: repeat(3, var(--square-size));
  grid-template-columns: repeat(6, var(--square-size));
  gap: var(--square-gap);
  padding: 20px;
  background: var(--background);
  border-radius: 8px;
}

.board-square {
  width: var(--square-size);
  height: var(--square-size);
  border: 2px solid #444;
  border-radius: 4px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.3s;
}

.board-square:hover {
  border-color: var(--primary-color);
  transform: scale(1.05);
}

.board-square.highlighted {
  border-color: #ffeb3b;
  box-shadow: 0 0 10px rgba(255, 235, 59, 0.5);
}
```

### Card Styling

```css
.card {
  width: 100px;
  height: 140px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
  border: 2px solid;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.card.common { border-color: var(--rarity-common); }
.card.rare { border-color: var(--rarity-rare); }
.card.epic { border-color: var(--rarity-epic); }
.card.legendary { border-color: var(--rarity-legendary); }

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}

.card.selected {
  border-width: 3px;
  box-shadow: 0 0 15px currentColor;
}
```

---

## Image Assets

### Directory Structure

```
public/
├── cards/               # Card images (200x280px)
│   ├── basic-pawn.png
│   ├── forward-push.png
│   └── ...
│
├── characters/          # Character portraits (300x400px)
│   ├── strategist-knight.png
│   ├── aerith-gainsborough.png
│   └── ...
│
├── maps/                # Map backgrounds (1920x1080px)
│   ├── starter-arena.png
│   ├── tactical-battlefield.png
│   └── ...
│
└── avatars/             # User avatars (150x150px)
    └── default.png
```

### Image Guidelines

**Card Images:**
- Size: 200×280px
- Format: PNG with transparency
- Naming: lowercase-with-hyphens.png
- Path: `/cards/card-name.png`

**Character Images:**
- Size: 300×400px
- Format: PNG with transparency
- Naming: lowercase-with-hyphens.png
- Path: `/characters/character-name.png`

**Map Images:**
- Size: 1920×1080px (or scaled)
- Format: PNG or JPG
- Naming: lowercase-with-hyphens.png
- Path: `/maps/map-name.png`

### Usage in Components

```jsx
// Card
<img
  src={`/cards/${card.cardImage}`}
  alt={card.name}
  className="card-image"
/>

// Character
<img
  src={character.characterPic}
  alt={character.name}
  className="character-portrait"
/>

// Map Background
<div
  className="game-board"
  style={{
    backgroundImage: `url(${map.image})`
  }}
>
```

---

## Migration Guide

### From Old System to New System

#### 1. Board Size Change

**Old:**
- Variable sizes (9-10 columns, 3-5 rows)
- Special squares with bonuses

**New:**
- Fixed 3×6 grid
- No special squares

**Migration:**
```javascript
// Update board rendering
const ROWS = 3;
const COLS = 6;

// Remove special square handling
// Before:
if (square.special?.type === 'multiplier') { ... }

// After:
// Remove this check entirely
```

#### 2. Character Abilities

**New Feature:**
- Characters now have abilities
- Multiple effects per character
- Display in character selection

**Add to Components:**
```jsx
<CharacterAbilities
  abilities={character.abilities}
/>
```

#### 3. API Changes

**Updated Endpoints:**
- All maps now return 3×6 grid
- Character data includes abilities object
- Game state includes character info

**Update API Calls:**
```javascript
// Character selection
const character = await api.getCharacter(characterId);
// Now includes: character.abilities.effects[]
```

---

## Card Display Usage

### Card Component

Display a single card with all information.

**Props:**
```javascript
<Card
  card={cardObject}
  selected={boolean}
  onClick={() => handleClick()}
  showDetails={boolean}
/>
```

**Card Object Structure:**
```javascript
{
  cardId: string,
  name: string,
  power: number,
  rarity: 'common' | 'rare' | 'epic' | 'legendary',
  cardType: 'standard' | 'buff' | 'debuff',
  pawnRequirement: number,
  cardImage: string,
  cardInfo: string,
  ability: {
    abilityDescription: string,
    effectType: string,
    effectValue: number
  }
}
```

### Card Grid

Display multiple cards in a grid.

```jsx
<div className="card-grid">
  {cards.map((card, index) => (
    <Card
      key={card.cardId}
      card={card}
      selected={selectedIndex === index}
      onClick={() => selectCard(index)}
    />
  ))}
</div>
```

### Card Details Modal

Show detailed card information.

```jsx
<CardDetailsModal
  card={card}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
>
  <div className="card-details">
    <h3>{card.name}</h3>
    <p>Power: {card.power}</p>
    <p>Rarity: {card.rarity}</p>
    <p>Type: {card.cardType}</p>
    <p>Pawn Req: {card.pawnRequirement}</p>
    {card.ability && (
      <div className="card-ability">
        <h4>Ability</h4>
        <p>{card.ability.abilityDescription}</p>
      </div>
    )}
  </div>
</CardDetailsModal>
```

---

## Environment Variables

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000

# Environment
REACT_APP_ENV=development

# Optional Features
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

---

## Troubleshooting

### WebSocket Connection Issues

**Problem:** Socket not connecting

**Solution:**
```javascript
// Check CORS settings
// Ensure token is valid
// Verify server is running
```

### Board Not Rendering

**Problem:** Board appears empty

**Solution:**
```javascript
// Check gameState structure
// Verify board dimensions (3×6)
// Inspect console for errors
```

### Cards Not Displaying

**Problem:** Card images not loading

**Solution:**
```javascript
// Check image paths (/cards/...)
// Verify public folder structure
// Check browser console for 404s
```

---

## Best Practices

1. **State Management**
   - Use local state for UI-only data
   - Use context for shared user data
   - Keep WebSocket state in game component

2. **Performance**
   - Memoize expensive calculations
   - Use React.memo for static components
   - Debounce user inputs

3. **Error Handling**
   - Always catch API errors
   - Show user-friendly error messages
   - Log errors for debugging

4. **Code Organization**
   - One component per file
   - Co-locate styles with components
   - Extract reusable logic to hooks

---

## Recent Changes

### 2025-12-13: Board Size Update

**Changed:**
- Board from variable size to fixed 3×6
- Removed special squares handling
- Updated all board-related components

**Migration Required:**
- Update board rendering logic
- Remove special square checks
- Test all board interactions

### 2025-12-13: Character Abilities

**Added:**
- Character ability display in selection
- Ability tooltips and descriptions
- Multi-effect support

**New Components:**
- `CharacterAbilityBadge`
- `AbilityTooltip`

---

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create pull request
5. Code review
6. Merge

---

## Support

- GitHub Issues
- Development Discord
- Email: support@example.com

---

*Documentation maintained by frontend development team*
*Last Updated: 2025-12-13*
