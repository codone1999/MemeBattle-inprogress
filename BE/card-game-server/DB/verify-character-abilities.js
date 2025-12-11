/**
 * Verification Script: Character Abilities
 *
 * This script verifies and displays character abilities to ensure they're correctly configured.
 * Specifically checks for start-of-game abilities like Aerith's pawn boost.
 *
 * Usage:
 *   node verify-character-abilities.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Character = require('../src/models/Character.model');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/board_game_db';

/**
 * Main verification function
 */
async function verifyCharacterAbilities() {
  try {
    console.log('🔍 Verifying Character Abilities...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all characters
    const characters = await Character.find();

    console.log(`Found ${characters.length} characters\n`);
    console.log('========================================\n');

    for (const character of characters) {
      console.log(`📜 Character: ${character.name}`);
      console.log(`   Rarity: ${character.rarity}`);
      console.log(`   Ability Type: ${character.abilities?.abilityType || 'None'}`);
      console.log(`   Skill: ${character.abilities?.skillName || 'None'}`);

      if (character.abilities?.effects && character.abilities.effects.length > 0) {
        console.log(`   Effects:`);

        for (const effect of character.abilities.effects) {
          console.log(`      - Type: ${effect.effectType}`);
          console.log(`        Value: ${effect.value}`);
          console.log(`        Condition: ${effect.condition}`);
          console.log(`        Target: ${effect.target}`);

          // Check for start-of-game abilities
          if (effect.condition && effect.condition.includes('start of game')) {
            console.log(`        ✨ START OF GAME ABILITY DETECTED!`);

            // Check if effect type is compatible with game logic
            if (effect.effectType === 'pawnBoost' || effect.effectType === 'addPawn') {
              console.log(`        ✅ Effect type "${effect.effectType}" is compatible`);
              console.log(`        💡 Player will start with ${1 + effect.value} pawns per row`);
            } else {
              console.log(`        ⚠️  Effect type "${effect.effectType}" may not be implemented`);
            }
          }
        }
      } else {
        console.log(`   Effects: None`);
      }

      console.log('');
    }

    console.log('========================================\n');

    // Specific check for Aerith
    const aerith = characters.find(c => c.name.toLowerCase().includes('aerith'));

    if (aerith) {
      console.log('🌸 AERITH GAINSBOROUGH - SPECIAL CHECK\n');
      console.log(`Character ID: ${aerith._id}`);
      console.log(`Full Abilities Object:`);
      console.log(JSON.stringify(aerith.abilities, null, 2));

      const hasStartGameEffect = aerith.abilities?.effects?.some(
        e => e.condition && e.condition.includes('start of game')
      );

      if (hasStartGameEffect) {
        console.log('\n✅ Aerith has start-of-game ability configured correctly!');

        const pawnEffect = aerith.abilities.effects.find(
          e => e.condition && e.condition.includes('start of game')
        );

        if (pawnEffect) {
          console.log(`   Effect Type: ${pawnEffect.effectType}`);
          console.log(`   Pawn Boost: +${pawnEffect.value}`);
          console.log(`   Starting Pawns: ${1 + pawnEffect.value} per row\n`);
        }
      } else {
        console.log('\n❌ Aerith does NOT have start-of-game ability configured!');
        console.log('   The ability may not be detected by the game logic.\n');
      }
    } else {
      console.log('⚠️  Aerith Gainsborough not found in database\n');
    }

    console.log('========================================\n');
    console.log('✨ Verification Complete!\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
}

// Run the verification
verifyCharacterAbilities()
  .then(() => {
    console.log('\n✨ Script finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
