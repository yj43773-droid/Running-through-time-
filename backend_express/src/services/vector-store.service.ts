import { OpenAIEmbeddings } from '@langchain/openai';
import { Diary } from '../types';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

let vectorStore: any = null;
let embeddings: any = null;
let db: Database.Database | null = null;

// SQLite 기반 로컬 임베디드 벡터 DB
// OpenAI text-embedding-3-small을 사용하여 의미론적 벡터 생성

/**
 * Initialize the vector store with SQLite (truly local/embedded) and OpenAI embeddings
 */
export async function initializeVectorStore(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    console.warn('⚠️  OPENAI_API_KEY not configured. Vector store will use local mode.');
    return;
  }

  try {
    // Initialize OpenAI embeddings (text-embedding-3-small)
    embeddings = new OpenAIEmbeddings({
      apiKey,
      model: 'text-embedding-3-small',
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
        embedding BLOB,
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
 * Add a diary entry to SQLite vector store with embedding
 */
export async function addDiaryToVectorStore(diary: Diary): Promise<void> {
  if (!vectorStore || !vectorStore.db || !vectorStore.embeddings) {
    console.warn('⚠️  Vector store not initialized. Skipping add operation.');
    return;
  }

  try {
    const db = vectorStore.db as Database.Database;

    // Generate embedding for the diary content
    console.log(`📝 Generating embedding for diary ${diary.id}...`);
    const embedding = await vectorStore.embeddings.embedQuery(diary.text);

    // Convert embedding array to binary format for storage
    const embeddingBuffer = Buffer.from(JSON.stringify(embedding));

    // Insert or replace diary in vector store with embedding
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO diary_vectors (id, userId, text, emotion, createdAt, embedding)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      diary.id,
      diary.userId,
      diary.text,
      diary.emotion || 'unknown',
      diary.createdAt,
      embeddingBuffer
    );

    console.log(`✅ Diary ${diary.id} added to Vector Store with embedding (${embedding.length} dimensions)`);
  } catch (error) {
    console.error('❌ Error adding diary to vector store:', error);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Search for semantically similar diaries using vector embeddings
 * @param diaryContent - Text content to search for similar diaries
 * @param userId - User ID to limit results to
 * @param limit - Maximum number of results to return (default: 3)
 * @param excludeDiaryId - Diary ID to exclude from results (e.g., current diary)
 */
export async function searchSimilarDiaries(
  diaryContent: string,
  userId: string,
  limit: number = 3,
  excludeDiaryId?: string
): Promise<any[]> {
  if (!vectorStore || !vectorStore.db || !vectorStore.embeddings) {
    console.warn('⚠️  Vector store not initialized. Returning empty results.');
    return [];
  }

  try {
    const db = vectorStore.db as Database.Database;

    // Generate embedding for the query
    console.log(`🔍 Generating query embedding...`);
    const queryEmbedding = await vectorStore.embeddings.embedQuery(diaryContent);

    // Get all diaries for this user from SQLite
    const stmt = db.prepare(`
      SELECT id, text, emotion, createdAt, embedding
      FROM diary_vectors
      WHERE userId = ? AND embedding IS NOT NULL
      ORDER BY createdAt DESC
    `);

    const diaries = stmt.all(userId) as Array<{ id: string; text: string; emotion: string; createdAt: string; embedding: Buffer | null }>;

    // Calculate semantic similarity for each diary
    const results = diaries
      .map((diary) => {
        if (!diary.embedding) return null;

        // Parse stored embedding
        const storedEmbedding = JSON.parse(diary.embedding.toString('utf-8')) as number[];

        // Calculate cosine similarity
        const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);

        return {
          id: diary.id,
          text: diary.text,
          content: diary.text.substring(0, 100),
          emotion: diary.emotion,
          date: diary.createdAt,
          similarity,
        };
      })
      .filter((r) => {
        // Filter by similarity threshold and exclude specified diary
        if (r === null || r.similarity <= 0.5) return false;
        if (excludeDiaryId && r.id === excludeDiaryId) return false;
        return true;
      })
      .sort((a, b) => b!.similarity - a!.similarity)
      .slice(0, limit);

    console.log(`✅ Found ${results.length} semantically similar diaries for user ${userId}`);
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
