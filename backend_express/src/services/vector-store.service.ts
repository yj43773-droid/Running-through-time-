import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Diary } from '../types';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

let vectorStore: any = null;
let embeddings: any = null;
let db: Database.Database | null = null;

// SQLite 기반 로컬 임베디드 벡터 DB
// 각 일기의 메타데이터를 SQLite에 저장

/**
 * Initialize the vector store with SQLite (truly local/embedded)
 */
export async function initializeVectorStore(): Promise<void> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    console.warn('⚠️  GOOGLE_API_KEY not configured. Vector store will use local mode.');
    return;
  }

  try {
    // Initialize embeddings model
    embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'embedding-001',
    });

    // Initialize SQLite database for vector store
    const dataDir = path.join(process.cwd(), 'vector_data');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'vectors.db');
    db = new Database(dbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create vector store table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS diary_vectors (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        text TEXT NOT NULL,
        emotion TEXT,
        createdAt DATETIME NOT NULL,
        savedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_userId ON diary_vectors(userId);
      CREATE INDEX IF NOT EXISTS idx_createdAt ON diary_vectors(createdAt);
    `);

    vectorStore = {
      embeddings,
      db,
      dbPath,
      dataDir,
    };

    console.log('✅ SQLite Vector Store initialized successfully');
    console.log(`   📁 Database: ${dbPath}`);
  } catch (error) {
    console.warn('⚠️  Vector store initialization warning:', error);
    vectorStore = {
      embeddings: null,
      db: null,
    };
  }
}

/**
 * Add a diary entry to SQLite vector store
 */
export async function addDiaryToVectorStore(diary: Diary): Promise<void> {
  if (!vectorStore || !vectorStore.db) {
    console.warn('⚠️  Vector store not initialized. Skipping add operation.');
    return;
  }

  try {
    const db = vectorStore.db as Database.Database;

    // Insert or replace diary in vector store
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO diary_vectors (id, userId, text, emotion, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      diary.id,
      diary.userId,
      diary.text,
      diary.emotion || 'unknown',
      diary.createdAt
    );

    console.log(`✅ Diary ${diary.id} added to SQLite Vector Store`);
  } catch (error) {
    console.error('❌ Error adding diary to vector store:', error);
  }
}

/**
 * Search for similar diaries from SQLite using keyword matching
 */
export async function searchSimilarDiaries(
  diaryContent: string,
  userId: string,
  limit: number = 3
): Promise<any[]> {
  if (!vectorStore || !vectorStore.db) {
    console.warn('⚠️  Vector store not initialized. Returning empty results.');
    return [];
  }

  try {
    const db = vectorStore.db as Database.Database;
    const contentWords = diaryContent.toLowerCase().split(/\s+/);

    // Get all diaries for this user from SQLite
    const stmt = db.prepare(`
      SELECT id, text, emotion, createdAt
      FROM diary_vectors
      WHERE userId = ?
      ORDER BY createdAt DESC
    `);

    const diaries = stmt.all(userId) as Array<{ id: string; text: string; emotion: string; createdAt: string }>;

    // Calculate similarity for each diary
    const results = diaries
      .map((diary) => {
        const diaryWords = diary.text.toLowerCase().split(/\s+/);
        const matchCount = contentWords.filter((w) => diaryWords.includes(w)).length;
        const similarity = contentWords.length > 0 ? matchCount / contentWords.length : 0;

        return {
          id: diary.id,
          content: diary.text.substring(0, 100),
          emotion: diary.emotion,
          date: diary.createdAt,
          similarity,
        };
      })
      .filter((r) => r.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`✅ Found ${results.length} similar diaries for user ${userId}`);
    return results;
  } catch (error) {
    console.error('❌ Error searching similar diaries:', error);
    return [];
  }
}

/**
 * Remove a diary from SQLite vector store
 */
export async function removeDiaryFromVectorStore(diaryId: string): Promise<void> {
  if (!vectorStore || !vectorStore.db) {
    console.warn('⚠️  Vector store not initialized. Skipping remove operation.');
    return;
  }

  try {
    const db = vectorStore.db as Database.Database;

    const stmt = db.prepare('DELETE FROM diary_vectors WHERE id = ?');
    stmt.run(diaryId);

    console.log(`✅ Diary ${diaryId} removed from SQLite Vector Store`);
  } catch (error) {
    console.error('❌ Error removing diary from vector store:', error);
  }
}

/**
 * Update a diary in the vector store
 */
export async function updateDiaryInVectorStore(diary: Diary): Promise<void> {
  try {
    await removeDiaryFromVectorStore(diary.id);
    await addDiaryToVectorStore(diary);
  } catch (error) {
    console.error('❌ Error updating diary in vector store:', error);
  }
}

/**
 * Get vector store stats
 */
export async function getVectorStoreStats() {
  if (!vectorStore || !vectorStore.db) {
    return {
      totalDiaries: 0,
      status: '⚠️  Vector store not initialized',
      mode: 'disabled',
      dbPath: 'N/A',
    };
  }

  try {
    const db = vectorStore.db as Database.Database;

    // Get total count
    const countResult = db.prepare('SELECT COUNT(*) as count FROM diary_vectors').get() as { count: number };
    const totalDiaries = countResult.count;

    return {
      totalDiaries,
      status: '✅ Vector store active (SQLite Embedded)',
      mode: 'sqlite-embedded',
      dbPath: vectorStore.dbPath || 'N/A',
      dataDir: vectorStore.dataDir || 'N/A',
    };
  } catch (error) {
    return {
      totalDiaries: 0,
      status: '❌ Error retrieving stats',
      mode: 'error',
    };
  }
}
