# MainGame Package

This package contains all game-related components for the actual gameplay phase of MemeBattle.

## Components

### Game.vue
Main game container that orchestrates the entire gameplay experience.

**Features:**
- Socket.io real-time communication
- Game state management
- Turn-based gameplay logic
- Card selection and placement
- Dice rolling phase
- Game end handling

**Props:** None (uses route params for gameId)

**Emits:** None (uses socket events)

### GameBoard.vue
Displays the 3x10 game board with cards, pawns, and special squares.

**Features:**
- Visual representation of the board
- Card placement preview
- Pawn display with ownership
- Special square effects visualization
- Click handling for card placement

### GameEnd.vue
Shows the game results screen when the game is finished.

**Features:**
- Winner/loser display
- Final scores
- Statistics breakdown
- Return to lobby button

### DiceRoll.vue
Handles the dice rolling phase at the start of each game.

**Features:**
- Animated dice rolling
- Turn order determination
- Waiting for opponent
- Results display

### PlayerHand.vue
Displays the player's hand of cards during gameplay.

**Features:**
- Card display with selection
- Visual feedback for turn status
- Card click handling
- Empty hand state

**Props:**
- `hand` - Array of card objects in player's hand
- `selectedIndex` - Currently selected card index
- `isMyTurn` - Whether it's the player's turn

**Emits:**
- `card-select` - Emitted when a card is clicked

## Character Abilities

### Start Game Abilities

The game system supports character abilities that trigger at game start. Currently implemented:

#### Aerith Gainsborough - Arcane Ward
- **Ability Type:** `start_game`
- **Effect:** `addPawn` with value `2`
- **Description:** Starts the game with 3 pawns instead of the default 1 pawn per row
- **Implementation:** Applied in `Game.service.js` during board initialization

**How It Works:**
1. When a game is created, character data is loaded from the database
2. During board initialization, the `_applyStartGameAbility` function checks each character
3. If the character has `abilityType: 'start_game'` with `effectType: 'addPawn'`, the value is added to starting pawns
4. Each row on the player's side starts with the modified pawn count (default 1 + ability value)

**Example:**
```javascript
// Aerith's ability
{
  skillName: 'Arcane Ward',
  skillDescription: 'Automatic started with 3 pawn row',
  abilityType: 'start_game',
  effects: [
    {
      effectType: 'addPawn',
      value: 2,  // Adds 2 pawns to the default 1
      condition: 'non',
      target: 'User Board'
    }
  ]
}

// Result: Player starts with 3 pawns per row instead of 1
```

### Adding New Start Game Abilities

To add more start_game abilities:

1. **Define in character document:**
   ```javascript
   {
     name: 'Character Name',
     abilities: {
       skillName: 'Skill Name',
       skillDescription: 'What the skill does',
       abilityType: 'start_game',
       effects: [
         {
           effectType: 'addPawn',  // or other effect types
           value: 2,
           condition: 'non',
           target: 'User Board'
         }
       ]
     }
   }
   ```

2. **Backend handles it automatically** in `Game.service.js`:
   - `_applyStartGameAbility()` processes the effects
   - Currently supports `effectType: 'addPawn'`
   - Extensible for future effect types

3. **No frontend changes needed** - the starting pawns are applied server-side during game creation

## File Structure

```
MainGame/
├── index.js           # Package exports
├── README.md          # This file
├── Game.vue           # Main game container
├── GameBoard.vue      # Board display
├── GameEnd.vue        # End game screen
├── DiceRoll.vue       # Dice rolling phase
└── PlayerHand.vue     # Player's hand display
```

## Dependencies

- **MainLobby/CardDisplay.vue** - Individual card component (used by PlayerHand)
- **@/utils/socket** - Socket.io client for real-time communication
- **@/utils/fetchApi** - API utility for HTTP requests

## Usage

Import components from the package:

```javascript
import { Game, GameBoard, GameEnd, DiceRoll, PlayerHand } from '@/components/MainGame';
```

Or import individually:

```javascript
import Game from '@/components/MainGame/Game.vue';
```

## Router Configuration

The Game component is route-configured in `router/index.js`:

```javascript
{
  path: '/game/:gameId',
  name: 'Game',
  component: Game,
  meta: { title: 'Game', requiresAuth: true }
}
```

## Backend Integration

### Game Service

The backend game logic is in `BE/card-game-server/src/services/Game.service.js`:

- `createGame()` - Initializes game state with character abilities
- `_initializeBoard()` - Creates board and applies start_game abilities
- `_applyStartGameAbility()` - Processes character ability effects

### Socket Events

Game uses the following socket events:

**Emitted by Client:**
- `game:join` - Join a game room
- `game:dice_roll` - Submit dice roll
- `game:action:preview` - Preview card placement
- `game:action:place_card` - Place a card
- `game:action:skip_turn` - Skip turn
- `game:leave` - Leave game

**Received by Client:**
- `game:load` - Initial game state
- `game:state:update` - Game state changes
- `game:dice_roll:start` - Dice roll phase started
- `game:dice_roll:result` - Dice roll results
- `game:action:preview` - Card placement preview
- `game:end` - Game ended
- `game:error` - Error messages

## Testing

To test character abilities:

1. Create a character with `start_game` ability in database
2. Assign character to player in lobby
3. Start game
4. Verify starting pawns match: `1 + ability.effects[0].value`

**Example Test Case:**
```
Character: Aerith Gainsborough
Ability: addPawn value=2
Expected: 3 pawns per row
Actual: board[row][column].pawns[playerId] === 3
```
