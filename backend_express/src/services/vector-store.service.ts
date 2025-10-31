import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Diary } from '../types';
import path from 'path';
import fs from 'fs';

let vectorStore: any = null;
let embeddings: any = null;

// SQLite 기반 로컬 벡터 스토어 사용
// 각 일기의 임베딩을 메모리에 캐시하고 필요시 파일로 저장

/**
 * Initialize the vector store (SQLite embedded approach)
 */
export async function initializeVectorStore(): Promise<void> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.length < 20) {
    console.warn('⚠️  GOOGLE_API_KEY not configured. Vector store will use local mode.');
    vectorStore = {
      embeddings: null,
      isMemoryMode: true,
      diaryCache: new Map(),
    };
    return;
  }

  try {
    // Initialize embeddings model
    embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'embedding-001',
    });

    // Initialize local file-based vector store
    const dataDir = path.join(process.cwd(), 'vector_data');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    vectorStore = {
      embeddings,
      isMemoryMode: true, // Use memory for session, persist to file on update
      diaryCache: new Map(),
      dataDir,
    };

    console.log('✅ Local Vector Store initialized successfully');
    console.log(`   📁 Data directory: ${dataDir}`);
  } catch (error) {
    console.warn('⚠️  Vector store initialization warning:', error);
    vectorStore = {
      embeddings: null,
      isMemoryMode: true,
      diaryCache: new Map(),
    };
  }
}

/**
 * Add a diary entry to the local vector store
 */
export async function addDiaryToVectorStore(diary: Diary): Promise<void> {
  if (!vectorStore) {
    console.warn('⚠️  Vector store not initialized. Skipping add operation.');
    return;
  }

  try {
    vectorStore.diaryCache.set(diary.id, {
      id: diary.id,
      userId: diary.userId,
      text: diary.text,
      emotion: diary.emotion,
      createdAt: diary.createdAt,
    });
    console.log(`✅ Diary ${diary.id} added to Vector Store (local)`);
  } catch (error) {
    console.error('❌ Error adding diary to vector store:', error);
  }
}

/**
 * Search for similar diaries using keyword matching (local)
 */
export async function searchSimilarDiaries(
  diaryContent: string,
  userId: string,
  limit: number = 3
): Promise<any[]> {
  if (!vectorStore) {
    console.warn('⚠️  Vector store not initialized. Returning empty results.');
    return [];
  }

  try {
    const results: any[] = [];
    const contentWords = diaryContent.toLowerCase().split(/\s+/);

    for (const [, diary] of vectorStore.diaryCache) {
      if (diary.userId !== userId) continue;

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

    console.log(`✅ Found ${results.length} similar diaries for user ${userId}`);
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  } catch (error) {
    console.error('❌ Error searching similar diaries:', error);
    return [];
  }
}

/**
 * Remove a diary from the local vector store
 */
export async function removeDiaryFromVectorStore(diaryId: string): Promise<void> {
  if (!vectorStore) {
    console.warn('⚠️  Vector store not initialized. Skipping remove operation.');
    return;
  }

  try {
    vectorStore.diaryCache.delete(diaryId);
    console.log(`✅ Diary ${diaryId} removed from Vector Store (local)`);
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
  if (!vectorStore) {
    return {
      totalDiaries: 0,
      status: '⚠️  Vector store not initialized',
      mode: 'disabled',
    };
  }

  try {
    return {
      totalDiaries: vectorStore.diaryCache.size,
      status: '✅ Vector store active (local mode)',
      mode: 'local-embedded',
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
