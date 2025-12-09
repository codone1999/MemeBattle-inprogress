# Migration Guide - MainGame Package Refactoring

## Overview

The game-related components have been moved from `MainLobby` to a new dedicated `MainGame` package for better organization and separation of concerns.

## What Changed

### New Package Structure

**Before:**
```
components/
└── MainLobby/
    ├── Game.vue
    ├── GameBoard.vue
    ├── GameEnd.vue
    ├── DiceRoll.vue
    ├── PlayerHand.vue
    ├── Inventory.vue
    ├── Lobby.vue
    └── LobbyRoom.vue
```

**After:**
```
components/
├── MainLobby/
│   ├── PlayerHand.vue      # Shared between deck building and gameplay
│   ├── Inventory.vue
│   ├── Lobby.vue
│   ├── LobbyRoom.vue
│   └── CardDisplay.vue
└── MainGame/               # NEW PACKAGE
    ├── index.js            # Package exports
    ├── README.md           # Documentation
    ├── Game.vue            # Main game container
    ├── GameBoard.vue       # Board display
    ├── GameEnd.vue         # End game screen
    └── DiceRoll.vue        # Dice rolling phase
```

## Files Moved

✅ **Moved to MainGame:**
- `Game.vue` (376 lines)
- `GameBoard.vue` (250 lines)
- `GameEnd.vue` (171 lines)
- `DiceRoll.vue` (184 lines)

❌ **Stayed in MainLobby:**
- `PlayerHand.vue` - Shared component used in both deck building and gameplay
- `CardDisplay.vue` - Shared card component
- `Inventory.vue` - Deck management
- `Lobby.vue` - Lobby list
- `LobbyRoom.vue` - Pre-game lobby

## Import Changes

### Router (Already Updated)

**Before:**
```javascript
import Game from '@/components/MainLobby/Game.vue';
```

**After:**
```javascript
import { Game } from '@/components/MainGame';
```

### If You Need Individual Components

**Option 1: Named imports from package**
```javascript
import { Game, GameBoard, GameEnd, DiceRoll } from '@/components/MainGame';
```

**Option 2: Direct imports**
```javascript
import Game from '@/components/MainGame/Game.vue';
import GameBoard from '@/components/MainGame/GameBoard.vue';
```

### Internal Imports (Already Fixed)

The `Game.vue` component correctly imports:
```javascript
import DiceRoll from './DiceRoll.vue';              // Same package
import GameBoard from './GameBoard.vue';            // Same package
import GameEnd from './GameEnd.vue';                // Same package
import PlayerHand from '../MainLobby/PlayerHand.vue'; // External package
```

## Breaking Changes

### None for Users

This is purely a structural refactoring. No API changes or behavior modifications.

### For Developers

If you had custom imports from `MainLobby` for game components, update them to:

```javascript
// OLD - Will not work
import Game from '@/components/MainLobby/Game.vue';
import GameBoard from '@/components/MainLobby/GameBoard.vue';

// NEW - Use these instead
import { Game, GameBoard } from '@/components/MainGame';
```

## New Features in MainGame Package

### Character Abilities System

The game now supports character start_game abilities:

```javascript
// Example: Aerith Gainsborough
{
  abilities: {
    skillName: 'Arcane Ward',
    skillDescription: 'Automatic started with 3 pawn row',
    abilityType: 'start_game',
    effects: [
      {
        effectType: 'addPawn',
        value: 2,
        condition: 'non',
        target: 'User Board'
      }
    ]
  }
}
```

**Result:** Player starts with 3 pawns per row instead of 1.

See [MainGame/README.md](src/components/MainGame/README.md) for full documentation.

## Verification Steps

### 1. Check File Structure
```bash
# MainGame package should exist
ls src/components/MainGame/
# Should show: DiceRoll.vue  Game.vue  GameBoard.vue  GameEnd.vue  index.js  README.md

# MainLobby should NOT have game files
ls src/components/MainLobby/ | grep -E "(Game|Dice)"
# Should return nothing
```

### 2. Check Imports
```bash
# Router should import from MainGame
grep "MainGame" src/router/index.js
# Should show: import { Game } from '@/components/MainGame';
```

### 3. Test Game Functionality
1. Start development server: `npm run dev`
2. Login to the game
3. Create/join a lobby
4. Start a game
5. Verify:
   - ✅ Game loads without errors
   - ✅ Dice roll works
   - ✅ Board displays correctly
   - ✅ Cards can be played
   - ✅ Game end screen shows
   - ✅ Character abilities apply (Aerith starts with 3 pawns)

## Rollback Plan

If issues occur, restore from git:

```bash
# View changes
git status

# Restore specific file
git checkout src/components/MainLobby/Game.vue

# Or restore all
git checkout src/components/MainLobby/
git checkout src/components/MainGame/
git checkout src/router/index.js
```

## Benefits of This Refactoring

✅ **Better Organization** - Game logic separated from lobby logic
✅ **Clear Dependencies** - Easier to understand what depends on what
✅ **Easier Testing** - Can test game components in isolation
✅ **Better Documentation** - Dedicated README for game package
✅ **Scalability** - Easy to add more game features
✅ **Character Abilities** - Foundation for future character abilities

## Questions?

See:
- [MainGame/README.md](src/components/MainGame/README.md) - Full package documentation
- [scripts/README.md](../scripts/README.md) - Database scripts for characters
- [IMAGE_GUIDE.md](public/IMAGE_GUIDE.md) - Asset management guide

---

**Migration Date:** December 9, 2025
**Status:** ✅ Completed
**Tested:** ✅ Verified working
