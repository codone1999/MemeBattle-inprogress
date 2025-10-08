// BE/Card-game-server/migrations/add-selected-character.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function addSelectedCharacter() {
  const db = await open({
    filename: './game.db',
    driver: sqlite3.Database
  });

  try {
    // Add selected_character column to inventories
    await db.run(`
      ALTER TABLE inventories 
      ADD COLUMN selected_character INTEGER DEFAULT NULL
    `);
    
    console.log('✅ Added selected_character column to inventories table');

    // Set default selected character for existing users
    await db.run(`
      UPDATE inventories 
      SET selected_character = 111 
      WHERE selected_character IS NULL
    `);
    
    console.log('✅ Set default character for existing users');

    // Add profile_picture column to users
    await db.run(`
      ALTER TABLE users 
      ADD COLUMN profile_picture TEXT DEFAULT NULL
    `);
    
    console.log('✅ Added profile_picture column to users table');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await db.close();
  }
}

addSelectedCharacter();