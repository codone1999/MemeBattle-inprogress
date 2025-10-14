// migrations/cleanup-default-images.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function cleanupDefaultImages() {
  console.log('🧹 Cleaning up default.png references...\n');
  
  const db = await open({
    filename: './game.db',
    driver: sqlite3.Database
  });

  try {
    // Check current state
    const beforeCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE profile_picture IS NOT NULL 
        AND (profile_picture = 'default.png' 
        OR profile_picture LIKE '%default.png%')
    `);
    
    console.log(`📊 Found ${beforeCount.count} users with default.png references`);

    // Clean up all default.png references
    await db.run(`
      UPDATE users 
      SET profile_picture = NULL 
      WHERE profile_picture = 'default.png' 
        OR profile_picture LIKE '%default.png%'
        OR profile_picture = ''
    `);

    // Verify cleanup
    const afterCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE profile_picture IS NOT NULL 
        AND (profile_picture = 'default.png' 
        OR profile_picture LIKE '%default.png%')
    `);

    console.log(`✅ Cleaned up. Remaining default.png references: ${afterCount.count}`);

    // Show current state
    const nullCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE profile_picture IS NULL
    `);

    const validCount = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE profile_picture IS NOT NULL
    `);

    console.log(`\n📈 Database state:`);
    console.log(`   - Users with NULL profile_picture: ${nullCount.count}`);
    console.log(`   - Users with valid profile_picture: ${validCount.count}`);

    // Show sample of users with valid profile pictures
    if (validCount.count > 0) {
      const samples = await db.all(`
        SELECT uid, username, profile_picture 
        FROM users 
        WHERE profile_picture IS NOT NULL 
        LIMIT 5
      `);

      console.log(`\n📋 Sample users with profile pictures:`);
      samples.forEach(user => {
        console.log(`   - ${user.username}: ${user.profile_picture}`);
      });
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await db.close();
  }

  console.log('\n✨ Cleanup complete!\n');
}

cleanupDefaultImages();