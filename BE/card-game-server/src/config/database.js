import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function getDatabase() {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../game.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  console.log(`✅ Database connected: ${dbPath}`);

  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    console.log('✅ Database connection closed');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});