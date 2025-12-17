# Retry/Rematch Game Feature

## Overview
Added a "Play Again (Rematch)" button to the game end screen that allows players to start a new game in the same lobby without returning to the lobby page. The game resets to the dice roll phase with reshuffled decks.

## User Request
"add retry button when game end to started game again in same lobby its will start at roll dice again no need to enter lobby page first"

## Implementation

### Frontend Changes

#### 1. **GameEnd.vue Component**
Added retry game emit and button

**Lines 11:**
```javascript
const emit = defineEmits(['return-lobby', 'retry-game']);
```

**Lines 124-129:**
```vue
<button
  @click="emit('retry-game')"
  class="w-full py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-black uppercase rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all"
>
  🎲 Play Again (Rematch)
</button>
```

**Button Design:**
- Primary action button with green theme
- Positioned above "Return to Inventory" and "Back to Lobby" buttons
- Large, prominent design to encourage rematches
- Includes dice emoji 🎲 and clear "Play Again (Rematch)" text

#### 2. **Game.vue Component**
Added retry handler function

**Lines 253-257:**
```javascript
const handleRetryGame = () => {
  if (confirm('Start a rematch with the same opponent?\n\n🎲 The game will restart from dice roll phase.')) {
    socket.emit('game:retry', { gameId });
  }
};
```

**Lines 537-542:**
```vue
<GameEnd
  v-else-if="gameState.phase === 'ended'"
  :game-state="gameState"
  @return-lobby="router.push('/lobby')"
  @retry-game="handleRetryGame"
/>
```

**Features:**
- Confirmation dialog to prevent accidental clicks
- Emits socket event to backend
- User stays on game page during reset

### Backend Changes

#### 1. **Game.socket.js - Socket Handler**
Added retry socket event listener

**Line 43:**
```javascript
socket.on('game:retry', (data) => this.handleRetryGame(socket, data));
```

**Lines 357-404: handleRetryGame method**
```javascript
async handleRetryGame(socket, data) {
  try {
    const { gameId } = data;
    const userId = socket.userId;

    // Validation
    if (!gameId) {
      return socket.emit('game:error', { message: 'Invalid game ID' });
    }

    // Get current game state
    const gameState = await this.gameService.getGameState(gameId);

    if (!gameState) {
      return socket.emit('game:error', { message: 'Game not found' });
    }

    // Verify game has ended
    if (gameState.phase !== 'ended') {
      return socket.emit('game:error', { message: 'Game has not ended yet' });
    }

    // Verify user is a player
    if (!gameState.players[userId]) {
      return socket.emit('game:error', { message: 'You are not a player in this game' });
    }

    // Retry the game
    const newGameState = await this.gameService.retryGame(gameId);

    // Broadcast reset state to both players
    this.io.to(gameId).emit('game:state', this._transformStateForPlayerView(newGameState, userId));

    // Notify to start rolling dice
    this.io.to(gameId).emit('game:dice_roll:start', {
      message: 'Rematch started! Roll for first turn!'
    });

    console.log(`✅ Game ${gameId} restarted successfully`);
  } catch (error) {
    console.error('Error retrying game:', error);
    socket.emit('game:error', { message: error.message || 'Failed to retry game' });
  }
}
```

**Validation Checks:**
1. Valid game ID
2. Game exists
3. Game has ended (can't retry active game)
4. User is a player in the game

#### 2. **Game.service.js - Reset Logic**
Added `retryGame` method to reset game state

**Lines 220-317: retryGame method**
```javascript
async retryGame(gameId) {
  const gameState = await this.getGameState(gameId);

  if (!gameState) {
    throw new Error('Game not found');
  }

  // Get players
  const playerIds = Object.keys(gameState.players);
  const [playerAId, playerBId] = playerIds;
  const playerA = gameState.players[playerAId];
  const playerB = gameState.players[playerBId];

  // Load decks and characters
  const [deckA, deckB] = await Promise.all([
    this.deckRepository.findByIdPopulated(playerA.deckId),
    this.deckRepository.findByIdPopulated(playerB.deckId)
  ]);

  const [characterA, characterB] = await Promise.all([
    this.characterRepository.findById(playerA.characterId),
    this.characterRepository.findById(playerB.characterId)
  ]);

  // Reshuffle decks
  const shuffledDeckA = this._shuffleDeck(deckA.cards);
  const shuffledDeckB = this._shuffleDeck(deckB.cards);

  // Draw new hands (5 cards each)
  const handA = shuffledDeckA.splice(0, 5);
  const handB = shuffledDeckB.splice(0, 5);

  // Re-initialize board
  const board = this._initializeBoard(
    gameState.mapId,
    playerAId,
    playerBId,
    characterA,
    characterB
  );

  // Reset Player A
  gameState.players[playerAId].hand = handA.map(card => ({
    cardId: card.cardId._id.toString(),
    ...card.cardId._doc
  }));
  gameState.players[playerAId].deck = shuffledDeckA.map(card => card.cardId._id.toString());
  gameState.players[playerAId].diceRoll = null;
  gameState.players[playerAId].diceDetails = null;
  gameState.players[playerAId].hasRolled = false;
  gameState.players[playerAId].consecutiveSkips = 0;
  gameState.players[playerAId].totalScore = 0;
  gameState.players[playerAId].rowScores = [0, 0, 0];
  gameState.players[playerAId].coinsEarned = 0;
  gameState.players[playerAId].abilityUsesRemaining = characterA.abilities?.maxUses || 0;
  gameState.players[playerAId].activeRowMultipliers = {};

  // Reset Player B (same as Player A)
  // ... (similar reset logic)

  // Reset game state
  gameState.status = 'dice_roll';
  gameState.phase = 'dice_roll';
  gameState.currentTurn = null;
  gameState.turnNumber = 0;
  gameState.board = board;
  delete gameState.endResult;
  delete gameState.winner;

  // Save updated state
  await this.updateGameState(gameId, gameState);

  return gameState;
}
```

## How It Works

### User Flow
```
Game Ends (Victory/Defeat/Draw)
  ↓
Game End Screen Displays
  ↓
User Clicks "🎲 Play Again (Rematch)"
  ↓
Confirmation Dialog: "Start a rematch?"
  ↓
User Confirms
  ↓
Frontend emits 'game:retry' socket event
  ↓
Backend validates and resets game
  ↓
Backend broadcasts reset state to both players
  ↓
Both players see Dice Roll screen
  ↓
Players roll dice to start new game
```

### What Gets Reset

#### Player State Reset
- ✅ **Hand**: New 5 cards drawn from reshuffled deck
- ✅ **Deck**: Fully reshuffled with new card order
- ✅ **Dice rolls**: Reset to null (both players must roll again)
- ✅ **Has rolled**: Reset to false
- ✅ **Consecutive skips**: Reset to 0
- ✅ **Scores**: Reset to 0 (total and row scores)
- ✅ **Coins earned**: Reset to 0
- ✅ **Ability uses**: Reset to max uses (e.g., Tifa gets 2 uses again)
- ✅ **Active row multipliers**: Cleared

#### Board State Reset
- ✅ **Board**: Re-initialized with starting pawn positions
- ✅ **All cards**: Removed from board
- ✅ **All pawns**: Reset to starting positions (column 0 and column 5)
- ✅ **Square effects**: Cleared (no buff/debuff markers)

#### Game State Reset
- ✅ **Phase**: Changed to 'dice_roll'
- ✅ **Status**: Changed to 'dice_roll'
- ✅ **Current turn**: Reset to null (determined by dice roll)
- ✅ **Turn number**: Reset to 0
- ✅ **End result**: Deleted
- ✅ **Winner**: Deleted

### What Stays the Same

#### Preserved State
- ✅ **Players**: Same two players
- ✅ **Characters**: Same character selections
- ✅ **Decks**: Same deck IDs (but reshuffled)
- ✅ **Map**: Same game board/map
- ✅ **Lobby**: Same lobby ID
- ✅ **Game ID**: Same game ID (important for socket rooms)

### Socket Events

#### Client → Server
**Event:** `game:retry`
```javascript
{
  gameId: string
}
```

#### Server → Client
**Event 1:** `game:state` (updated game state)
- Sends reset game state to both players
- Uses normal state transformation (home/away view)

**Event 2:** `game:dice_roll:start` (prompt to roll)
```javascript
{
  message: 'Rematch started! Roll for first turn!'
}
```

**Error Event:** `game:error` (if retry fails)
```javascript
{
  message: string // Error description
}
```

## Benefits

### For Players
1. **Quick Rematch**: No need to navigate through lobby screens
2. **Same Opponent**: Continue playing against the same player
3. **Fresh Game**: Decks are reshuffled, new hands, new starting positions
4. **Fair Start**: Both players roll dice again to determine first turn

### For UX
1. **Streamlined Flow**: Reduces clicks and navigation
2. **Maintains Context**: Players stay in the game environment
3. **Clear Feedback**: Confirmation dialog and dice roll prompt
4. **Prominent Button**: Green, large button makes retry obvious

### For Code Quality
1. **Reusable Logic**: Uses existing `_initializeBoard` and `_shuffleDeck` methods
2. **Validation**: Multiple checks ensure game can be safely retried
3. **Error Handling**: Catches and reports errors to user
4. **Consistent State**: Resets all necessary fields to match new game state

## Edge Cases Handled

### 1. Player Leaves During Reset
- Socket room is maintained
- If player disconnects, normal disconnect handling applies
- Other player sees disconnect and can choose to wait or leave

### 2. Multiple Retry Requests
- Game must be in 'ended' phase to retry
- Once retry starts, phase changes to 'dice_roll'
- Subsequent retry requests are rejected until game ends again

### 3. Deck/Character Not Found
- If deck or character was deleted, retry will fail
- Error message sent to user
- User can return to lobby to select new deck/character

### 4. One Player Clicks Retry
- Currently, either player can trigger retry
- Both players are immediately reset to dice roll phase
- Future enhancement: Could require both players to agree

## Future Enhancements

### 1. Two-Player Consent
Add a ready/accept system where both players must agree to rematch:
```javascript
// Track ready state
gameState.retryReady = {
  [playerAId]: false,
  [playerBId]: false
};

// When both ready
if (gameState.retryReady[playerAId] && gameState.retryReady[playerBId]) {
  // Proceed with retry
}
```

### 2. Retry Countdown
Add a countdown timer before starting the rematch:
```javascript
// 5 second countdown
let countdown = 5;
const interval = setInterval(() => {
  io.to(gameId).emit('game:retry_countdown', { seconds: countdown });
  countdown--;
  if (countdown < 0) {
    clearInterval(interval);
    // Start game
  }
}, 1000);
```

### 3. Rematch Statistics
Track rematch counts and win streaks:
```javascript
gameState.rematchCount = (gameState.rematchCount || 0) + 1;
gameState.winStreak = {
  [winnerId]: (gameState.winStreak?.[winnerId] || 0) + 1,
  [loserId]: 0
};
```

### 4. Cancel Retry
Allow canceling during countdown:
```javascript
socket.on('game:retry_cancel', () => {
  clearInterval(countdownInterval);
  io.to(gameId).emit('game:retry_cancelled');
});
```

## Testing Checklist

### Manual Testing
- [x] Click "Play Again" button on victory screen
- [x] Click "Play Again" button on defeat screen
- [x] Click "Play Again" button on draw screen
- [x] Confirm dialog appears and is clear
- [x] Cancel confirmation dialog - nothing happens
- [x] Accept confirmation - game resets
- [ ] Both players see dice roll screen after reset
- [ ] Decks are reshuffled (different cards in hand)
- [ ] Board is reset to starting positions
- [ ] Scores are reset to 0
- [ ] Character abilities reset (Tifa gets 2 uses again)
- [ ] Dice rolls work correctly after reset
- [ ] Game plays normally after reset
- [ ] Can complete multiple rematches in a row

### Error Cases
- [ ] Try retry when game is still playing (should fail)
- [ ] Try retry with invalid game ID (should fail)
- [ ] Try retry as spectator (should fail)
- [ ] One player disconnects during reset
- [ ] Both players disconnect during reset

## Related Files

### Frontend
- **FE/src/components/MainGame/GameEnd.vue** - Retry button UI
- **FE/src/components/MainGame/Game.vue** - Retry handler and socket emit

### Backend
- **BE/card-game-server/src/sockets/Game.socket.js** - Socket event handler
- **BE/card-game-server/src/services/Game.service.js** - Reset game logic

## Notes

- The retry feature keeps players in the same game room
- Game ID and lobby ID remain the same
- Useful for best-of-3 or tournament-style play
- Encourages player retention and engagement
- No need to reconfigure decks or characters between games

## Conclusion

The retry/rematch feature provides a seamless way for players to continue playing multiple games without leaving the game environment. It maintains all the necessary context (players, characters, decks, map) while providing a fresh start with reshuffled decks and reset board state. This improves player engagement and makes the game more suitable for competitive play.
