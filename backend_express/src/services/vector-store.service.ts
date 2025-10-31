import { OpenAIEmbeddings } from '@langchain/openai';
import { Diary } from '../types';
import { db } from '../db';

let embeddings: any = null;

// OpenAI 기반 통합 벡터 임베딩 (database.db에 직접 저장)
// SQLite의 embedding BLOB 컬럼에 1536차원 벡터 저장

/**
 * Initialize embeddings API (no separate DB needed)
 */
export async function initializeVectorStore(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    console.warn('⚠️  OPENAI_API_KEY not configured. Vector embeddings will be disabled.');
    return;
  }

  try {
    // Initialize OpenAI embeddings (text-embedding-3-small)
    embeddings = new OpenAIEmbeddings({
      apiKey,
      model: 'text-embedding-3-small',
    });

    console.log('✅ Vector Store initialized (using database.db)');
  } catch (error) {
    console.warn('⚠️  Vector store initialization warning:', error);
    embeddings = null;
  }
}

/**
 * Generate and store embedding for a diary
 */
export async function generateAndStoreEmbedding(diaryId: string, text: string): Promise<Buffer | null> {
  if (!embeddings) {
    console.warn('⚠️  Embeddings not initialized. Skipping embedding generation.');
    return null;
  }

  try {
    console.log(`📝 Generating embedding for diary ${diaryId}...`);
    const embedding = await embeddings.embedQuery(text);

    // Convert embedding array to binary format
    const embeddingBuffer = Buffer.from(JSON.stringify(embedding));

    console.log(`✅ Embedding generated (${embedding.length} dimensions)`);
    return embeddingBuffer;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    return null;
  }
}

/**
 * Add embedding to an existing diary
 */
export async function addDiaryEmbedding(diaryId: string, text: string): Promise<void> {
  if (!embeddings) {
    console.warn('⚠️  Embeddings not initialized. Skipping...');
    return;
  }

  try {
    const embeddingBuffer = await generateAndStoreEmbedding(diaryId, text);

    if (!embeddingBuffer) return;

    // Update diary with embedding
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE diaries SET embedding = ? WHERE id = ?',
        [embeddingBuffer, diaryId],
        (err) => {
          if (err) {
            console.error('❌ Error storing embedding:', err);
            reject(err);
          } else {
            console.log(`✅ Diary ${diaryId} updated with embedding`);
            resolve();
          }
        }
      );
    });
  } catch (error) {
    console.error('❌ Error adding diary embedding:', error);
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
  if (!embeddings) {
    console.warn('⚠️  Embeddings not initialized. Returning empty results.');
    return [];
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Generate embedding for the query
      console.log(`🔍 Generating query embedding...`);
      const queryEmbedding = await embeddings.embedQuery(diaryContent);

      // Get all diaries for this user with embeddings from database.db
      db.all(
        `SELECT id, text, emotion, createdAt, embedding
         FROM diaries
         WHERE userId = ? AND embedding IS NOT NULL
         ORDER BY createdAt DESC`,
        [userId],
        (err, rows: any[]) => {
          if (err) {
            console.error('❌ Error fetching diaries:', err);
            reject(err);
            return;
          }

          // Calculate semantic similarity for each diary
          const results = (rows || [])
            .map((diary) => {
              if (!diary.embedding) return null;

              try {
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
              } catch (e) {
                console.warn(`⚠️  Failed to parse embedding for diary ${diary.id}`);
                return null;
              }
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
          resolve(results);
        }
      );
    } catch (error) {
      console.error('❌ Error searching similar diaries:', error);
      reject(error);
    }
  });
}

/**
 * Remove embedding from a diary
 */
export async function removeDiaryEmbedding(diaryId: string): Promise<void> {
  if (!embeddings) return;

  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE diaries SET embedding = NULL WHERE id = ?',
      [diaryId],
      (err) => {
        if (err) {
          console.error('❌ Error removing embedding:', err);
          reject(err);
        } else {
          console.log(`✅ Embedding removed for diary ${diaryId}`);
          resolve();
        }
      }
    );
  });
}

/**
 * Update embedding for a diary (delete old, generate new)
 */
export async function updateDiaryEmbedding(diaryId: string, text: string): Promise<void> {
  try {
    await removeDiaryEmbedding(diaryId);
    await addDiaryEmbedding(diaryId, text);
  } catch (error) {
    console.error('❌ Error updating diary embedding:', error);
  }
}

/**
 * Get vector store stats
 */
export async function getVectorStoreStats() {
  return new Promise((resolve) => {
    if (!embeddings) {
      resolve({
        totalDiaries: 0,
        totalWithEmbeddings: 0,
        status: '⚠️  Embeddings not initialized',
        mode: 'disabled',
      });
      return;
    }

    db.get(
      `SELECT COUNT(*) as total, SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as withEmbeddings
       FROM diaries`,
      (err, row: any) => {
        if (err) {
          resolve({
            totalDiaries: 0,
            totalWithEmbeddings: 0,
            status: '❌ Error retrieving stats',
            mode: 'error',
          });
        } else {
          resolve({
            totalDiaries: row?.total || 0,
            totalWithEmbeddings: row?.withEmbeddings || 0,
            status: '✅ Vector Store active (integrated with database.db)',
            mode: 'integrated',
          });
        }
      }
    );
  });
}
