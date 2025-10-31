import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_URL || './database.db';

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

export function initializeDatabase() {
  return new Promise<void>((resolve, reject) => {
    try {
      db.serialize(() => {
        // Create users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            displayName TEXT,
            passwordHash TEXT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) console.error('Error creating users table:', err);
        });

        // Create diaries table
        db.run(`
          CREATE TABLE IF NOT EXISTS diaries (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            text TEXT NOT NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            emotion TEXT NOT NULL,
            aiCharacter TEXT NOT NULL,
            aiResponse TEXT NOT NULL,
            isEvolved BOOLEAN NOT NULL DEFAULT 0,
            reinterpretation TEXT,
            evolvedEmotion TEXT,
            aiPersonaResponses TEXT,
            similarDiaryRefs TEXT,
            emotionColor TEXT,
            evolvedEmotionColor TEXT,
            linkedPastDiaryId TEXT,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (linkedPastDiaryId) REFERENCES diaries(id) ON DELETE SET NULL
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) console.error('Error creating diaries table:', err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_diaries_createdAt ON diaries(createdAt)`, (err) => {
          if (err && !err.message.includes('already exists')) console.error('Error creating index:', err);
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_diaries_userId ON diaries(userId)`, (err) => {
          if (err && !err.message.includes('already exists')) console.error('Error creating index:', err);
        });

        // Create memory_orbs table
        db.run(`
          CREATE TABLE IF NOT EXISTS memory_orbs (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            diaryId TEXT NOT NULL,
            emotion TEXT NOT NULL,
            date DATETIME NOT NULL,
            isReinterpreted BOOLEAN NOT NULL DEFAULT 0,
            reinterpretationNote TEXT,
            reinterpretationReplies TEXT,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (diaryId) REFERENCES diaries(id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) {
            console.error('Error creating memory_orbs table:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}
