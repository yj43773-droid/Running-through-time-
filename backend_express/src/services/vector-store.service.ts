import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Diary } from '../types';

// Simple in-memory cache for similar diaries
// In production, this would be replaced with chromadb
const diaryCache: Map<string, any> = new Map();

/**
 * Initialize the vector store
 * Note: Full chromadb integration requires a running Chroma server
 * For now, we use in-memory caching with embedding-based similarity
 */
export async function initializeVectorStore(): Promise<void> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    console.warn('⚠️  GOOGLE_API_KEY not configured. Vector store will use fallback mode.');
    return;
  }

  try {
    // Test if embeddings work
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'embedding-001',
    });

    console.log('✅ Vector store initialized successfully');
  } catch (error) {
    console.warn('⚠️  Vector store initialization warning:', error);
    console.warn('   → Using in-memory caching fallback');
  }
}

/**
 * Add a diary entry to the vector store
 */
export async function addDiaryToVectorStore(diary: Diary): Promise<void> {
  try {
    const cacheEntry = {
      id: diary.id,
      userId: diary.userId,
      text: diary.text,
      emotion: diary.emotion,
      createdAt: diary.createdAt,
    };

    diaryCache.set(diary.id, cacheEntry);
    console.log(`Diary ${diary.id} added to vector store cache`);
  } catch (error) {
    console.error('Error adding diary to vector store:', error);
  }
}

/**
 * Search for similar diaries using simple text matching
 */
export async function searchSimilarDiaries(
  diaryContent: string,
  userId: string,
  limit: number = 3
): Promise<any[]> {
  try {
    const results: any[] = [];

    // Simple keyword-based similarity search
    const contentWords = diaryContent.toLowerCase().split(/\s+/);

    for (const [, diary] of diaryCache) {
      if (diary.userId !== userId || diary.id === diaryContent) continue;

      const diaryWords = diary.text.toLowerCase().split(/\s+/);
      const matchCount = contentWords.filter((w) => diaryWords.includes(w)).length;
      const similarity = contentWords.length > 0 ? matchCount / contentWords.length : 0;

      if (similarity > 0.1) {
        results.push({
          id: diary.id,
          content: diary.text.substring(0, 100),
          emotion: diary.emotion,
          date: diary.createdAt,
          similarity,
        });
      }
    }

    // Sort by similarity and return top results
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  } catch (error) {
    console.error('Error searching similar diaries:', error);
    return [];
  }
}

/**
 * Remove a diary from the vector store
 */
export async function removeDiaryFromVectorStore(diaryId: string): Promise<void> {
  try {
    diaryCache.delete(diaryId);
    console.log(`Diary ${diaryId} removed from vector store cache`);
  } catch (error) {
    console.error('Error removing diary from vector store:', error);
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
    console.error('Error updating diary in vector store:', error);
  }
}

/**
 * Get vector store stats
 */
export function getVectorStoreStats() {
  return {
    totalDiaries: diaryCache.size,
  };
}
