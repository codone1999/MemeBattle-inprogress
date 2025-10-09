import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function migrate() {
  console.log('🔄 Fixing inventory table...\n');

  const db = await open({
    filename: './game.db',
    driver: sqlite3.Database
  });

  try {
    // Check if selected_character column exists
    const tableInfo = await db.all('PRAGMA table_info(inventories)');
    const hasSelectedCharacter = tableInfo.some(col => col.name === 'selected_character');
    
    if (!hasSelectedCharacter) {
      await db.run(`
        ALTER TABLE inventories ADD COLUMN selected_character INTEGER
      `);
      console.log('✅ Added selected_character column to inventories');
    } else {
      console.log('✓ selected_character column already exists');
    }

    // Verify friends table structure
    const friendsInfo = await db.all('PRAGMA table_info(friends)');
    console.log('\n📋 Friends table structure:');
    friendsInfo.forEach(col => {
      console.log(`   - ${col.name}: ${col.type}`);
    });

    // Check if there are any friends
    const friendCount = await db.get('SELECT COUNT(*) as count FROM friends');
    console.log(`\n👥 Total friendships in database: ${friendCount.count}`);

    // Show some sample data
    if (friendCount.count > 0) {
      const samples = await db.all('SELECT * FROM friends LIMIT 5');
      console.log('\n📊 Sample friend records:');
      samples.forEach(record => {
        console.log(`   User ${record.user_id} ↔️ Friend ${record.friend_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }

  console.log('\n✨ Migration complete!\n');
}

migrate();