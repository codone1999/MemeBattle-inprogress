/**
 * Combined MongoDB script to add Aerith character and grant to user
 *
 * Usage:
 * mongosh "mongodb://localhost:27017/board_game_db" setup-aerith.js
 */

const username = 'thiti17134';
const characterName = 'aerith gainsborough';

print('=== Adding Aerith Gainsborough Character ===\n');

// Step 1: Check if character already exists
let aerith = db.characters.findOne({ name: characterName });

if (aerith) {
  print(`ℹ️  Character '${characterName}' already exists (ID: ${aerith._id})`);
} else {
  // Insert Aerith character
  db.characters.insertOne({
    name: 'aerith gainsborough',
    characterPic: '/characters/aerith gainsborough.png',
    rarity: 'rare',
    description: 'A flower peddler living in the Sector 5 slums, Aerith has been under Shinra surveillance all her life because of her unique background. Capable of sensing the planet\'s life force, she offers magical support to her comrades.',
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
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  aerith = db.characters.findOne({ name: characterName });
  print(`✅ Character '${characterName}' added successfully! (ID: ${aerith._id})`);
}

print('\n=== Granting Character to User ===\n');

// Step 2: Find the user
const user = db.users.findOne({ username: username });
if (!user) {
  print(`❌ Error: User '${username}' not found!`);
  quit();
}
print(`✅ Found user: ${username} (ID: ${user._id})`);

// Step 3: Find user's inventory
const inventory = db.inventories.findOne({ userId: user._id });
if (!inventory) {
  print(`❌ Error: Inventory not found for user ${username}!`);
  quit();
}
print(`✅ Found inventory (ID: ${inventory._id})`);

// Step 4: Check if user already has this character
const hasCharacter = inventory.characters.some(char =>
  char.characterId.toString() === aerith._id.toString()
);

if (hasCharacter) {
  print(`⚠️  User already has ${aerith.name}!`);
} else {
  // Step 5: Add character to user's inventory
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

// Step 6: Show final results
print('\n=== Summary ===\n');
print('Character Details:');
printjson(aerith);

const updatedInventory = db.inventories.findOne({ userId: user._id });
print('\n📦 User\'s Characters:');
updatedInventory.characters.forEach(char => {
  const charData = db.characters.findOne({ _id: char.characterId });
  print(`  - ${charData.name} (Rarity: ${charData.rarity}, Acquired: ${char.acquiredAt})`);
});

print('\n✅ Setup complete!');
