/**
 * MongoDB script to grant Aerith character to user thiti17134
 *
 * Prerequisites:
 * 1. Run add-aerith-character.js first to add the character to database
 *
 * Usage:
 * mongosh "mongodb://localhost:27017/board_game_db" grant-aerith-to-user.js
 */

const username = 'thiti17134';
const characterName = 'aerith gainsborough';

// 1. Find the user
const user = db.users.findOne({ username: username });
if (!user) {
  print(`❌ Error: User '${username}' not found!`);
  quit();
}
print(`✅ Found user: ${username} (ID: ${user._id})`);

// 2. Find Aerith character
const aerith = db.characters.findOne({ name: characterName });
if (!aerith) {
  print(`❌ Error: Character '${characterName}' not found!`);
  print('   Please run add-aerith-character.js first!');
  quit();
}
print(`✅ Found character: ${aerith.name} (ID: ${aerith._id})`);

// 3. Find user's inventory
const inventory = db.inventories.findOne({ userId: user._id });
if (!inventory) {
  print(`❌ Error: Inventory not found for user ${username}!`);
  quit();
}
print(`✅ Found inventory (ID: ${inventory._id})`);

// 4. Check if user already has this character
const hasCharacter = inventory.characters.some(char =>
  char.characterId.toString() === aerith._id.toString()
);

if (hasCharacter) {
  print(`⚠️  User already has ${aerith.name}!`);
} else {
  // 5. Add character to user's inventory
  db.inventories.updateOne(
    { _id: inventory._id },
    {
      $push: {
        characters: {
          characterId: aerith._id,
          acquiredAt: new Date(),
          _id: new ObjectId()
        }
      },
      $set: {
        updatedAt: new Date()
      }
    }
  );
  print(`✅ ${aerith.name} has been granted to ${username}!`);
}

// 6. Show updated inventory
const updatedInventory = db.inventories.findOne({ userId: user._id });
print('\n📦 User\'s Characters:');
updatedInventory.characters.forEach(char => {
  const charData = db.characters.findOne({ _id: char.characterId });
  print(`  - ${charData.name} (acquired: ${char.acquiredAt})`);
});
