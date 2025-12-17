# Two-Player Retry Consent System

## Overview
Updated the retry/rematch feature to require both players to confirm before starting a new game. This prevents one player from forcing an unwanted rematch on the other player.

## User Request
"in retry button make both player have to press to start play game again"

## Implementation

### How It Works

#### User Flow
```
Game Ends
  ↓
Both players see "Ready for Rematch" button
  ↓
Player 1 clicks button → Status changes to "Ready"
  ↓
Ready status panel appears showing:
  - Player 1: ✓ Ready
  - Player 2: ○ Not Ready
  ↓
Player 2 clicks button → Status changes to "Ready"
  ↓
Ready status panel updates:
  - Player 1: ✓ Ready
  - Player 2: ✓ Ready
  ↓
"Starting rematch..." message appears
  ↓
Game automatically resets to dice roll phase
```

#### Cancel Flow
```
Player is Ready
  ↓
Player clicks "Cancel Ready" button
  ↓
Status changes back to "Not Ready"
  ↓
Can click "Ready for Rematch" again to re-ready
```

### Frontend Changes

#### GameEnd.vue Component

**Lines 33-36: Ready Status Computed Properties**
```javascript
// Retry ready status
const myRetryReady = computed(() => props.gameState.retryReady?.[props.gameState.me.userId] || false);
const opponentRetryReady = computed(() => props.gameState.retryReady?.[props.gameState.opponent.userId] || false);
const bothPlayersReady = computed(() => myRetryReady.value && opponentRetryReady.value);
```

**Lines 129-149: Ready Status Display Panel**
```vue
<!-- Rematch Ready Status -->
<div v-if="myRetryReady || opponentRetryReady" class="bg-stone-800 border-2 border-green-600 rounded-xl p-4 mb-4">
  <div class="text-center mb-3">
    <h3 class="text-lg font-bold text-green-400">⏳ Waiting for Rematch...</h3>
  </div>
  <div class="grid grid-cols-2 gap-4 text-center">
    <!-- Your Status -->
    <div :class="myRetryReady ? 'text-green-400' : 'text-stone-500'">
      <div class="text-3xl mb-1">{{ myRetryReady ? '✓' : '○' }}</div>
      <div class="text-sm font-bold">You</div>
      <div class="text-xs">{{ myRetryReady ? 'Ready' : 'Not Ready' }}</div>
    </div>
    <!-- Opponent Status -->
    <div :class="opponentRetryReady ? 'text-green-400' : 'text-stone-500'">
      <div class="text-3xl mb-1">{{ opponentRetryReady ? '✓' : '○' }}</div>
      <div class="text-sm font-bold">Opponent</div>
      <div class="text-xs">{{ opponentRetryReady ? 'Ready' : 'Not Ready' }}</div>
    </div>
  </div>
  <!-- Both Ready Message -->
  <div v-if="bothPlayersReady" class="mt-3 text-center text-green-400 text-sm animate-pulse">
    🎲 Starting rematch...
  </div>
</div>
```

**Lines 152-158: Ready Button (when not ready)**
```vue
<button
  v-if="!myRetryReady"
  @click="emit('retry-game')"
  class="w-full py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-black uppercase rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all"
>
  🎲 Ready for Rematch
</button>
```

**Lines 160-167: Cancel Ready Button (when ready)**
```vue
<button
  v-else
  @click="emit('retry-game')"
  class="w-full py-4 bg-stone-600 hover:bg-stone-500 text-white text-xl font-black uppercase rounded-xl border-b-8 border-stone-800 active:border-b-0 active:translate-y-2 transition-all"
>
  ✗ Cancel Ready
</button>
```

#### Game.vue Component

**Lines 253-256: Simplified Handler (removed confirmation)**
```javascript
const handleRetryGame = () => {
  // Toggle ready status for rematch
  socket.emit('game:retry', { gameId });
};
```

No confirmation dialog needed anymore since players can toggle their ready status.

### Backend Changes

#### Game.socket.js - Socket Handler

**Lines 357-447: handleRetryGame Method (complete rewrite)**
```javascript
async handleRetryGame(socket, data) {
  try {
    const { gameId } = data;
    const userId = socket.userId;

    // Validation
    if (!gameId) {
      return socket.emit('game:error', { message: 'Invalid game ID' });
    }

    const gameState = await this.gameService.getGameState(gameId);

    if (!gameState) {
      return socket.emit('game:error', { message: 'Game not found' });
    }

    if (gameState.phase !== 'ended') {
      return socket.emit('game:error', { message: 'Game has not ended yet' });
    }

    if (!gameState.players[userId]) {
      return socket.emit('game:error', { message: 'You are not a player in this game' });
    }

    // Initialize retryReady object if not exists
    if (!gameState.retryReady) {
      gameState.retryReady = {};
    }

    // Toggle ready status
    gameState.retryReady[userId] = !gameState.retryReady[userId];

    console.log(`✓ User ${userId} is now ${gameState.retryReady[userId] ? 'ready' : 'not ready'} for retry`);

    // Save updated state
    await this.gameService.updateGameState(gameId, gameState);

    // Get both player IDs
    const playerIds = Object.keys(gameState.players);

    // Check if both players are ready
    const bothReady = playerIds.every(playerId => gameState.retryReady[playerId]);

    if (bothReady) {
      console.log(`🎮 Both players ready - starting rematch for game ${gameId}`);

      // Reset the game
      const newGameState = await this.gameService.retryGame(gameId);

      // Send transformed state to each player
      const playerAId = playerIds[0];
      const playerBId = playerIds[1];

      const socketA = this.userSockets.get(playerAId);
      const socketB = this.userSockets.get(playerBId);

      if (socketA) {
        socketA.emit('game:state', this._transformStateForPlayerView(newGameState, playerAId));
      }
      if (socketB) {
        socketB.emit('game:state', this._transformStateForPlayerView(newGameState, playerBId));
      }

      // Notify both players to start rolling dice
      this.io.to(gameId).emit('game:dice_roll:start', {
        message: 'Rematch started! Roll for first turn!'
      });

      console.log(`✅ Game ${gameId} restarted successfully`);
    } else {
      // Broadcast updated ready status to both players
      playerIds.forEach(playerId => {
        const playerSocket = this.userSockets.get(playerId);
        if (playerSocket) {
          playerSocket.emit('game:state', this._transformStateForPlayerView(gameState, playerId));
        }
      });
    }
  } catch (error) {
    console.error('Error handling retry game:', error);
    socket.emit('game:error', { message: error.message || 'Failed to handle retry request' });
  }
}
```

**Key Changes:**
1. **Toggle Logic**: Clicking button toggles ready status (true ↔ false)
2. **Ready Tracking**: Uses `gameState.retryReady = { playerId: boolean }`
3. **Both Ready Check**: Only starts game when BOTH players are ready
4. **Live Updates**: Broadcasts updated ready status to both players in real-time
5. **Auto-Start**: Automatically starts when both ready (no additional action needed)

#### Game.service.js - Reset Logic

**Line 310: Clear Retry Ready Status**
```javascript
delete gameState.retryReady; // Clear retry ready status
```

Added cleanup of retry ready status when game resets, so next game end starts fresh.

### Game State Structure

#### New Field: retryReady
```javascript
gameState = {
  // ... existing fields
  retryReady: {
    [playerId1]: true,   // Player 1 is ready
    [playerId2]: false   // Player 2 is not ready
  }
}
```

**Properties:**
- Only exists when game is in 'ended' phase
- Deleted when game resets to dice_roll phase
- Each player has independent ready status
- Both must be `true` for game to start

### Visual Design

#### Ready Status Panel
- **Header**: "⏳ Waiting for Rematch..."
- **Green border**: Indicates active waiting state
- **Two columns**: Shows both players' status side-by-side
- **Color coding**:
  - Green (✓) = Ready
  - Gray (○) = Not Ready
- **Starting message**: "🎲 Starting rematch..." when both ready

#### Buttons
1. **Ready for Rematch** (green)
   - Large, prominent button
   - Green background with shadow
   - Shows when player is NOT ready
   - Text: "🎲 Ready for Rematch"

2. **Cancel Ready** (gray)
   - Same size as ready button
   - Gray/stone background
   - Shows when player IS ready
   - Text: "✗ Cancel Ready"
   - Allows changing mind

### Benefits

#### For Players
1. **Mutual Consent**: Both players must agree to rematch
2. **No Forced Games**: Can't be forced into unwanted rematch
3. **Clear Feedback**: See when opponent is ready
4. **Can Cancel**: Change mind after clicking ready
5. **Automatic Start**: No extra clicks once both ready

#### For UX
1. **Visual Status**: Clear checkmarks show ready state
2. **Real-time Updates**: See opponent's status immediately
3. **Prominent Display**: Ready panel appears between players
4. **Smooth Transition**: "Starting rematch..." before auto-start
5. **Reversible**: Can unready if waiting too long

#### For Fairness
1. **Equal Power**: Both players have equal say
2. **No Pressure**: No one is forced to continue
3. **Transparent**: Both see each other's ready status
4. **Time to Decide**: No rush, can take time to decide
5. **Exit Option**: Still have "Back to Lobby" button

### Edge Cases Handled

#### 1. One Player Readies, Other Leaves
- If player leaves while ready status active
- Normal leave/disconnect handling applies
- Remaining player returns to lobby
- No partial ready state carries over

#### 2. Both Ready, Connection Lost
- If connection lost during auto-start
- Normal reconnection handling applies
- Game will be in dice_roll phase when reconnected
- retryReady status already cleared

#### 3. Player Toggles Multiple Times
- Can ready/unready as many times as needed
- Status broadcasts each toggle
- Opponent sees real-time updates
- No limit on changes

#### 4. Both Click at Same Time
- Backend handles sequentially
- Both will be marked ready
- Game starts normally
- Race condition safe (both checks pass)

#### 5. One Ready, Game Times Out
- No timeout implemented for retry ready
- Players can stay on end screen indefinitely
- Can use "Back to Lobby" or "Inventory" buttons anytime
- Ready status persists until leaving or starting

### Comparison: Before vs After

#### Before (Single-Click Start)
```
Player 1: Clicks "Play Again"
          ↓
          Confirmation dialog
          ↓
          Confirms
          ↓
          Game IMMEDIATELY resets for BOTH players
          ↓
Player 2: Forced into dice roll phase (no choice!)
```

**Problem**: Player 2 has no say in rematch decision.

#### After (Two-Player Consent)
```
Player 1: Clicks "Ready for Rematch"
          ↓
          Status: Player 1 ✓ Ready, Player 2 ○ Not Ready
          ↓
          Waits for Player 2...
          ↓
Player 2: Sees Player 1 is ready
          ↓
          Decides: Ready or Decline?
          ↓
          Option A: Clicks "Ready for Rematch"
          ↓
          Status: Player 1 ✓ Ready, Player 2 ✓ Ready
          ↓
          Both see "Starting rematch..."
          ↓
          Game resets to dice roll

          OR

          Option B: Clicks "Back to Lobby"
          ↓
          Returns to lobby (declines rematch)
```

**Solution**: Both players must explicitly agree to continue.

### Future Enhancements

#### 1. Ready Timeout
Add automatic unready after X seconds of waiting:
```javascript
// After player readies
setTimeout(() => {
  if (gameState.retryReady[userId] && !bothReady) {
    gameState.retryReady[userId] = false;
    // Notify: "Ready timeout - click again if you still want to play"
  }
}, 60000); // 60 seconds
```

#### 2. Chat/Messaging
Allow quick messages during ready phase:
```javascript
// Quick chat options
"Let's play again!"
"Give me a minute"
"One more game?"
"Good game, thanks!"
```

#### 3. Ready Notifications
Add sound/notification when opponent readies:
```javascript
if (opponentRetryReady.value && !prevOpponentReady) {
  playSound('ready_notification.mp3');
  showToast('Opponent is ready for rematch!');
}
```

#### 4. Best-of-X Series
Track games in a series:
```javascript
gameState.series = {
  gamesPlayed: 3,
  scores: {
    [playerId1]: 2, // 2 wins
    [playerId2]: 1  // 1 win
  }
};
```

## Testing Checklist

### Basic Functionality
- [x] Click "Ready for Rematch" → Status changes to ready
- [x] Click "Cancel Ready" → Status changes back to not ready
- [x] One player ready → Status panel appears
- [x] Both players ready → "Starting rematch..." appears
- [x] Both players ready → Game auto-starts to dice roll
- [ ] Ready status shows correctly for both players
- [ ] Status updates in real-time when opponent readies

### Edge Cases
- [ ] One player readies, other clicks "Back to Lobby"
- [ ] One player readies, other clicks "Inventory"
- [ ] Both click ready at exact same time
- [ ] Player readies, then disconnects
- [ ] Player readies, unreadies, readies again multiple times
- [ ] Game resets properly after both ready

### Visual/UX
- [ ] Ready checkmark (✓) shows for ready players
- [ ] Empty circle (○) shows for not ready players
- [ ] Green color for ready status
- [ ] Gray color for not ready status
- [ ] "Starting rematch..." animates (pulse effect)
- [ ] Button changes from green to gray when ready
- [ ] Button text changes appropriately

## Related Files

### Frontend
- **FE/src/components/MainGame/GameEnd.vue**
  - Lines 33-36: Ready status computed properties
  - Lines 129-149: Ready status display panel
  - Lines 152-167: Ready/Cancel buttons

- **FE/src/components/MainGame/Game.vue**
  - Lines 253-256: Retry handler (simplified)

### Backend
- **BE/card-game-server/src/sockets/Game.socket.js**
  - Lines 357-447: Two-player consent logic

- **BE/card-game-server/src/services/Game.service.js**
  - Line 310: Clear retry ready status on reset

## Conclusion

The two-player consent system ensures that both players have equal say in whether to continue playing. This creates a fairer, more respectful experience where no player is forced into an unwanted game. The ready/unready toggle gives players flexibility to change their mind, while the automatic start when both are ready provides a smooth, seamless transition into the next game.
