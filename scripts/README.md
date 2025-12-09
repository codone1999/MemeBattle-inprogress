# MongoDB Scripts

This directory contains MongoDB scripts for managing game data.

## Setup Aerith Gainsborough Character

### Option 1: Combined Script (Recommended)

Run the combined script to add Aerith and grant her to the user in one command:

```bash
# Windows (Command Prompt)
mongosh "mongodb://localhost:27017/board_game_db" setup-aerith.js

# Windows (PowerShell)
mongosh "mongodb://localhost:27017/board_game_db" .\setup-aerith.js

# Linux/Mac
mongosh "mongodb://localhost:27017/board_game_db" setup-aerith.js
```

### Option 2: Step-by-Step Scripts

If you prefer to run each step separately:

**Step 1: Add character to database**
```bash
mongosh "mongodb://localhost:27017/board_game_db" add-aerith-character.js
```

**Step 2: Grant character to user**
```bash
mongosh "mongodb://localhost:27017/board_game_db" grant-aerith-to-user.js
```

## Customizing the Scripts

### Change Target User

Edit the username in the script files:

```javascript
// In grant-aerith-to-user.js or setup-aerith.js
const username = 'thiti17134'; // Change this to your username
```

### Add Different Character

Edit the character data in `add-aerith-character.js` or `setup-aerith.js`:

```javascript
db.characters.insertOne({
  name: 'your character name',
  characterPic: '/characters/your-character.png',
  rarity: 'rare', // common, rare, epic, legendary
  description: 'Your character description',
  abilities: {
    skillName: 'Skill Name',
    skillDescription: 'What the skill does',
    abilityType: 'start_game', // or other ability types
    effects: [
      {
        effectType: 'addPawn',
        value: 2,
        condition: 'non',
        target: 'User Board'
      }
    ]
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Troubleshooting

### Connection Issues

If you can't connect to MongoDB:

1. Check MongoDB is running: `mongosh`
2. Verify database name: `show dbs`
3. Check connection string in the command

### Character Already Exists

The scripts will detect if:
- Character already exists in database (will skip creation)
- User already has the character (will skip granting)

### User Not Found

Make sure the username exists in the database:

```javascript
// Check in mongosh
use board_game_db
db.users.findOne({ username: "thiti17134" })
```

## Script Output

Successful execution will show:

```
=== Adding Aerith Gainsborough Character ===

✅ Character 'aerith gainsborough' added successfully! (ID: ...)

=== Granting Character to User ===

✅ Found user: thiti17134 (ID: ...)
✅ Found inventory (ID: ...)
✅ aerith gainsborough has been granted to thiti17134!

=== Summary ===

Character Details: { ... }

📦 User's Characters:
  - cloud strife (Rarity: legendary, Acquired: ...)
  - aerith gainsborough (Rarity: rare, Acquired: ...)

✅ Setup complete!
```
