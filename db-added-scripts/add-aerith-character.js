/**
 * MongoDB script to add Aerith Gainsborough character to the database
 *
 * Usage:
 * mongosh "mongodb://localhost:27017/board_game_db" add-aerith-character.js
 */

// Insert Aerith character into characters collection
db.characters.insertOne({
  name: 'aerith gainsborough',
  characterPic: '/characters/aerith gainsborough.png',
  rarity: 'legendary',
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

print('✅ Aerith Gainsborough character added successfully!');

// Show the inserted character
const aerith = db.characters.findOne({ name: 'aerith gainsborough' });
print('\nInserted Character:');
printjson(aerith);
