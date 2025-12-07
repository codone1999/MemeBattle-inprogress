# Complete Testing Guide - Queen's Blood Game

## Quick Start Testing

### Prerequisites
1. **Backend Running**: `cd BE/card-game-server && npm start`
2. **Frontend Running**: `cd FE && npm run dev`
3. **MongoDB Running**: Database seeded with cards, characters, maps
4. **Redis Running**: For game state storage

---

## Testing Flow (2 Players Required)

### Step 1: Create Accounts & Login
Open 2 browser windows/tabs:

**Player 1 (Window 1)**:
1. Go to `http://localhost:5173` (or your Vite port)
2. Sign up or login
3. Navigate to `/inventory`
4. Create a deck with 10 cards
5. Make sure you have characters in inventory

**Player 2 (Window 2)**:
1. Open incognito/different browser
2. Go to `http://localhost:5173`
3. Sign up or login with different account
4. Navigate to `/inventory`
5. Create a deck with 10 cards
6. Make sure you have characters in inventory

---

### Step 2: Lobby Setup

**Player 1 (Host)**:
1. Navigate to `/lobby`
2. Click "Create Lobby"
3. Enter lobby name
4. You'll be redirected to `/lobby/:lobbyId`
5. Select your deck from dropdown
6. Select your character from dropdown
7. Select a map (as host)
8. Click "Mark as Ready"
9. **Copy the lobby URL** from browser address bar

**Player 2 (Guest)**:
1. Navigate to `/lobby` OR paste the lobby URL directly
2. If on lobby list, click "Join" on the lobby
3. You'll be redirected to `/lobby/:lobbyId`
4. Select your deck from dropdown
5. Select your character from dropdown
6. Click "Mark as Ready"

**Player 1 (Host)**:
1. Once Player 2 is ready, the "Start Battle" button becomes enabled
2. Click "Start Battle"
3. Both players will be redirected to `/game/:gameId`

---

### Step 3: Dice Roll Phase

**Both Players**:
1. You'll see the dice roll screen
2. Click "Roll Dice!" button
3. Watch the animation
4. See your 2 dice values (e.g., 4 + 3 = 7)
5. Wait for opponent to roll

**Result**:
- If **different totals**: Higher roll goes first → transition to Playing phase
- If **same total**: "It's a Tie!" message → both roll again after 2 seconds

---

### Step 4: Playing Phase - First Turn

The player who won the dice roll goes first.

**Active Player (Your Turn)**:

1. **View the Board**:
   - 3 rows × 10 columns grid
   - You start with 1 pawn in center of your row (bottom for you)
   - Opponent has 1 pawn in center of their row (top for you)

2. **View Your Hand**:
   - 5 cards displayed at bottom
   - Each card shows: Power, Type, Pawn Requirement, Rarity

3. **Select a Card**:
   - Click on any card in your hand
   - Card will lift up and highlight (yellow border)
   - Check its pawn requirement (●●●● symbols)

4. **Hover Over Board Squares**:
   - Move mouse over squares on the board
   - See green highlights = where pawns will be added
   - See blue highlights = where ability will affect
   - If invalid, you'll see red toast error message

5. **Place the Card**:
   - Click on a valid square (one with enough of YOUR pawns)
   - Card is placed
   - Pawns are added to adjacent squares
   - Score recalculates
   - Turn switches to opponent

**Waiting Player**:
- See "⏳ Opponent's Turn" indicator
- Watch as opponent places their card
- Board updates in real-time
- Your turn indicator changes to "🎯 Your Turn"

---

### Step 5: Continue Playing

**Each Turn, Active Player Can**:

**Option A: Play a Card**
1. Select card from hand
2. Hover to preview placement
3. Click to place
4. Turn ends, opponent's turn

**Option B: Skip Turn**
1. Click "Skip Turn (Draw Card)" button
2. Confirm the action
3. Draw 1 card from deck
4. Skip counter increments (max 3 consecutive)
5. Turn ends, opponent's turn

**Important Rules**:
- ✅ Can place card only on squares with YOUR pawns
- ✅ Pawn requirement must be met (card needs X pawns)
- ✅ Can replace opponent's card (pawn override)
- ✅ Max 4 pawns per square
- ✅ Skip counter resets when you play a card
- ❌ Cannot place on your own card
- ❌ Cannot skip more than 3 times consecutively

---

### Step 6: Score System Testing

**Watch Scores Update**:
- After each card placement, scores recalculate
- Check row scores (R0, R1, R2) for both players
- Check total scores

**Test Score Mechanics**:

1. **Standard Cards** (no ability):
   - Place card, see its power added to your row total
   - If you have highest total in a row, you get those points

2. **Buff Cards** (📈):
   - Place near your other cards
   - Hover over affected squares (blue highlight)
   - See power increase on affected cards
   - Score calculation shows boosted values

3. **Debuff Cards** (📉):
   - Place near opponent's cards
   - Watch opponent's card power decrease
   - Note: Abilities affect BOTH sides if in range

4. **Row Control**:
   - Player with higher total in a row wins that row
   - Winner gets their total added to overall score
   - Tied row = neither player gets points

**Example**:
```
Row 0: You=10, Opp=8  → You win, +10 to your total
Row 1: You=5, Opp=12  → Opp wins, +12 to their total
Row 2: You=7, Opp=7   → Tie, no points for either
Total: You=10, Opp=12 → Opponent winning
```

---

### Step 7: Game End

**Game Ends When**: Both players have empty hand AND empty deck

**Result Screen**:

**Winner**:
- "🏆 Victory!" message
- Shows final scores
- Shows coins earned (+2)
- "Return to Lobby" button

**Loser**:
- "💔 Defeat" message
- Shows final scores
- No coins earned
- "Return to Lobby" button

**Draw** (rare):
- "🤝 Draw!" message
- Same score for both
- No coins
- "Return to Lobby" button

---

## Specific Test Cases

### Test Case 1: Pawn Requirement Validation

1. Start game
2. Select a card with pawn requirement 2 (●●)
3. Try to place on a square with only 1 pawn
4. **Expected**: Red toast "Need 2 pawns (you have 1)"
5. Place cards to add pawns to that square
6. Try again with 2+ pawns
7. **Expected**: Placement succeeds

### Test Case 2: Pawn Override

1. Place your card on a square
2. Opponent places their card on same square (if they have pawns there)
3. **Expected**: Your card is replaced
4. **Expected**: Square now owned by opponent
5. **Expected**: Pawns reset to 1 for opponent

### Test Case 3: Skip Turn Limit

1. Skip turn (draw card)
2. Skip turn again (draw card)
3. Skip turn third time (draw card)
4. Try to skip fourth time
5. **Expected**: Button disabled, message "Skip Limit Reached"
6. Must play a card
7. After playing card, skip counter resets to 0

### Test Case 4: Consecutive Turns

1. Player 1 places card
2. **Expected**: Turn indicator switches
3. **Expected**: Player 2's "Your Turn" becomes active
4. Player 2 places card
5. **Expected**: Turn indicator switches back
6. **Expected**: Turn number increments

### Test Case 5: Ability Effects

**Buff Card**:
1. Place a standard card (power 3)
2. Place a buff card next to it (+2 bonus)
3. **Expected**: Hover shows blue highlight on affected square
4. **Expected**: Score calculation shows 3 + 2 = 5 for that card

**Debuff Card**:
1. Opponent has card with power 5
2. Place debuff card near it (-2 reduction)
3. **Expected**: Hover shows blue highlight
4. **Expected**: Opponent's card effectively becomes 3 power in score calc

### Test Case 6: Player Perspective

**Very Important**: Each player sees themselves on the LEFT (bottom of board)

**Player 1's View**:
- I am on the left/bottom (blue)
- Opponent on the right/top (red)
- My starting pawn at board[2][5] (appears bottom center)

**Player 2's View**:
- I am on the left/bottom (blue)
- Opponent on the right/top (red)
- My starting pawn appears bottom center TO ME
- (Backend transformed coordinates 180°)

**Test**:
1. Player 1 places card at (5, 2)
2. Player 1 sees it in bottom row, center
3. Player 2 sees same card in top row, center
4. **Both players always see themselves at the bottom**

### Test Case 7: Real-Time Updates

**Setup**: Player 1 and Player 2 both viewing game

**Test**:
1. Player 1 (on their turn) places a card
2. Player 2's screen should update automatically
3. **Expected on Player 2's screen**:
   - Board updates with new card
   - Scores recalculate
   - Turn indicator shows "Your Turn"
   - No page reload needed

### Test Case 8: Disconnect/Reconnect

1. Player 1 playing game
2. Close browser tab
3. Open new tab, login again
4. Navigate back to `/game/:gameId`
5. **Expected**: Game state restored
6. **Expected**: Can continue playing

(Note: Depends on backend reconnection logic)

---

## Visual Verification Checklist

### Lobby Room
- [ ] Host sees "Host" label (blue)
- [ ] Guest sees "Challenger" label (red)
- [ ] Both can select deck and character
- [ ] Only host can select map
- [ ] "Start Battle" button only visible to host
- [ ] "Start Battle" enabled only when both ready
- [ ] Real-time updates when player changes deck/character/ready

### Dice Roll Phase
- [ ] Both players see dice roll screen
- [ ] "Roll Dice!" button appears
- [ ] After rolling, see 2 dice and total
- [ ] "Waiting for opponent..." message shown
- [ ] When both rolled, result displayed
- [ ] Winner announced clearly
- [ ] Tie detection and re-roll works
- [ ] Smooth transition to playing phase

### Playing Phase - Board
- [ ] 3 rows × 10 columns visible
- [ ] Starting pawns placed correctly (center of each side)
- [ ] Cards show: power, type icon, name
- [ ] Empty squares show pawn counts
- [ ] Preview highlights (green for pawns, blue for abilities)
- [ ] Turn indicator shows correctly
- [ ] Current player has glowing indicator

### Playing Phase - Hand
- [ ] 5 cards displayed initially
- [ ] Card selection highlights card
- [ ] Card shows: power, type, pawn req, rarity, ability
- [ ] Selected card lifts up visually
- [ ] Disabled when not your turn

### Playing Phase - Scores
- [ ] Total scores visible for both players
- [ ] Row scores shown (R0, R1, R2)
- [ ] Scores update after each card placement
- [ ] Animation/highlight on score change

### Playing Phase - Actions
- [ ] "Skip Turn" button functional
- [ ] Skip button disabled at 3 consecutive skips
- [ ] Skip counter displayed (X/3)
- [ ] Leave game button works

### Game End Phase
- [ ] Correct result shown (Victory/Defeat/Draw)
- [ ] Final scores displayed
- [ ] Coins earned shown (if winner)
- [ ] "Return to Lobby" button works
- [ ] Transition back to lobby list

---

## Performance Testing

### Expected Performance
- **Socket Latency**: <200ms for updates
- **Card Placement**: <500ms from click to board update
- **Dice Roll**: <100ms response
- **Score Recalculation**: <50ms
- **State Update Broadcast**: <300ms

### Load Testing (Optional)
1. Open 10+ browser tabs
2. Create 5 games simultaneously
3. All should work without lag
4. Check Redis memory usage
5. Check MongoDB connection pool

---

## Common Issues & Solutions

### Issue 1: Socket Not Connecting
**Symptoms**: "Establishing Secure Connection..." forever

**Check**:
1. Backend server running on correct port
2. VITE_BACKEND env variable correct
3. CORS settings in backend
4. Check browser console for errors

**Fix**:
```javascript
// FE/.env
VITE_BACKEND=http://localhost:3000

// BE check CORS origin
```

### Issue 2: Dice Roll Not Working
**Symptoms**: Button clicks but nothing happens

**Check**:
1. `game:dice_roll:submit` event sent
2. Backend receives event (check logs)
3. `game:dice_roll:result` event received
4. gameState.phase is 'dice_roll'

**Debug**:
```javascript
// In DiceRoll.vue
console.log('Rolling dice, gameState:', props.gameState);

// In Game.vue
socket.on('game:dice_roll:result', (result) => {
  console.log('Dice result received:', result);
});
```

### Issue 3: Card Won't Place
**Symptoms**: Click on square, nothing happens

**Check**:
1. Is it your turn? (isMyTurn = true)
2. Is card selected? (selectedCardIndex !== null)
3. Does square have enough pawns?
4. Check error toast message

**Debug**:
```javascript
// In Game.vue
const handleSquareClick = (x, y) => {
  console.log('Square clicked:', x, y);
  console.log('Selected card:', gameState.value.me.hand[selectedCardIndex.value]);
  console.log('Is my turn:', isMyTurn.value);
  // ... rest of code
};
```

### Issue 4: Scores Not Updating
**Symptoms**: Place card but scores don't change

**Check**:
1. Backend score calculation function
2. `game:state:update` event received
3. gameState reactive property updating
4. Vue component re-rendering

**Fix**: Check BE/card-game-server/src/services/Game.service.js line 640-711

### Issue 5: Player Sees Wrong Perspective
**Symptoms**: Board appears flipped incorrectly

**Check**:
1. Backend transformation in Game.socket.js
2. gameState.me.position should be 'left'
3. gameState.opponent.position should be 'right'
4. Board coordinates in gameState

**Expected**:
- Both players ALWAYS see themselves on bottom/left
- Backend handles coordinate transformation

### Issue 6: Game Doesn't End
**Symptoms**: Both players out of cards, game continues

**Check**:
1. `_checkGameEnd()` function
2. hand.length === 0 for both
3. deck.length === 0 for both
4. Backend emits `game:end` event

**Fix**: Check BE/card-game-server/src/services/Game.service.js line 716-724

---

## Debug Console Commands

Open browser console, useful commands:

```javascript
// Check game state
console.log('Game State:', gameState.value);

// Check socket connection
console.log('Socket connected:', socket.connected);

// Check current turn
console.log('Current turn:', gameState.value?.currentTurn);
console.log('My userId:', gameState.value?.me?.userId);

// Emit test event
socket.emit('game:action:skip_turn');

// Listen to all events
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

---

## Success Criteria

Game is fully working when:

✅ Two players can create and join lobby
✅ Both can select deck, character, map
✅ Both can ready up
✅ Host can start game
✅ Dice roll determines first player
✅ Tie detection and re-roll works
✅ First player can place card
✅ Second player sees update instantly
✅ Turns alternate correctly
✅ Pawns are added correctly
✅ Pawn requirement enforced
✅ Card abilities work (buff/debuff)
✅ Scores calculate correctly
✅ Row winners determined properly
✅ Skip turn draws card (max 3)
✅ Skip counter resets on card play
✅ Game ends when both out of cards
✅ Winner determined correctly
✅ Coins awarded to winner
✅ Stats updated in database
✅ Both players see game end screen
✅ Can return to lobby and play again

---

## Post-Testing Checklist

After successful testing:

1. **Database Check**:
   - [ ] Game saved to MongoDB games collection
   - [ ] User stats updated (wins/losses)
   - [ ] Coins added to winner's account
   - [ ] Lobby deleted after game end

2. **Redis Check**:
   - [ ] Game state deleted after completion
   - [ ] No memory leaks
   - [ ] User game mappings cleaned up

3. **Logs Review**:
   - [ ] No errors in backend logs
   - [ ] No errors in browser console
   - [ ] Socket events logged correctly
   - [ ] Score calculations logged

4. **Edge Cases**:
   - [ ] What happens if player disconnects mid-game?
   - [ ] What happens if player refreshes page?
   - [ ] What happens if both players leave?
   - [ ] What if Redis restarts during game?

---

## Next Steps

After testing is complete:

1. **Bug Fixes**: Address any issues found
2. **Polish**: Add animations, sound effects
3. **Mobile**: Test on mobile devices
4. **Performance**: Optimize if needed
5. **Security**: Review authentication, authorization
6. **Deployment**: Deploy to production

---

## Need Help?

Refer to documentation:
- [GAME_FLOW_DOCUMENTATION.md](BE/card-game-server/GAME_FLOW_DOCUMENTATION.md) - Complete game mechanics
- [SOCKET_EVENTS_REFERENCE.md](BE/card-game-server/SOCKET_EVENTS_REFERENCE.md) - Socket.IO events
- [IMPLEMENTATION_SUMMARY.md](BE/card-game-server/IMPLEMENTATION_SUMMARY.md) - What was implemented

**Happy Testing! 🎮**
