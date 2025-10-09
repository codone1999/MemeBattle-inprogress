import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function migrate() {
  console.log('🔄 Adding lobby features...\n');

  const db = await open({
    filename: './game.db',
    driver: sqlite3.Database
  });

  try {
    // Add game_mode to lobbies
    await db.run(`
      ALTER TABLE lobbies ADD COLUMN game_mode TEXT DEFAULT 'normal'
    `);
    console.log('✅ Added game_mode column');

    // Create lobby_invites table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS lobby_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lobby_id TEXT NOT NULL,
        from_user_id INTEGER NOT NULL,
        to_user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users(uid) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(uid) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created lobby_invites table');

    // Add indexes
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_lobby_invites_to_user ON lobby_invites(to_user_id);
      CREATE INDEX IF NOT EXISTS idx_lobby_invites_status ON lobby_invites(status);
    `);
    console.log('✅ Created indexes');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await db.close();
  }

  console.log('\n✨ Migration complete!\n');
}

migrate();