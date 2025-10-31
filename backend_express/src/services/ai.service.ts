import { Diary } from '../types';
import * as ragService from './rag.service';
import * as vectorStore from './vector-store.service';
import * as orbService from './orb.service';
import { db } from '../db';

interface PersonaResponse {
  persona: string;
  label: string;
  style: string;
  message: string;
}

/**
 * Generate AI responses using RAG system
 * Falls back to template responses if RAG is unavailable
 */
export async function generateResponses(
  diary: Diary,
  userId: string
): Promise<PersonaResponse[]> {
  const apiKey = process.env.GOOGLE_API_KEY;

  // Check if API key is properly configured
  if (!apiKey || apiKey.length < 20) {
    console.warn('⚠️  GOOGLE_API_KEY not configured or invalid, using template responses');
    return generateTemplateResponses(diary);
  }

  try {
    // Try to use RAG if API key is available
    console.log('📝 Attempting to generate AI responses using Gemini API...');
    return await ragService.generateRAGResponses(diary, userId);
  } catch (error) {
    console.error('❌ RAG generation failed, falling back to templates:', error);
    return generateTemplateResponses(diary);
  }
}

/**
 * Generate template responses (fallback when RAG is unavailable)
 */
function generateTemplateResponses(diary: Diary): PersonaResponse[] {
  const PERSONAS = [
    {
      key: 'gentle',
      label: '상냥한 공감러 (루미)',
      style: '따뜻하고 포용적인 말투로 위로와 공감을 전합니다.',
    },
    {
      key: 'pragmatic',
      label: '현실적인 조언자 (제트)',
      style: '현실적이고 명확한 조언을 제공합니다.',
    },
    {
      key: 'humorous',
      label: '유머러스한 친구 (모카)',
      style: '가볍고 재치있는 농담으로 분위기를 전환합니다.',
    },
  ];

  const responses: PersonaResponse[] = [];

  for (const persona of PERSONAS) {
    let message = '';

    if (persona.key === 'gentle') {
      message = `너무 수고했어요. 지금 느끼는 감정을 충분히 느껴도 괜찮아요.`;
    } else if (persona.key === 'pragmatic') {
      message = `지금 상황을 한 걸음 떨어져서 바라보면 도움이 될 수 있어요. 작은 행동부터 시작해 볼까요?`;
    } else {
      message = `이럴 땐 스스로를 위해 초콜릿 하나쯤은 괜찮지 않을까요? 😉`;
    }

    responses.push({
      persona: persona.key,
      label: persona.label,
      style: persona.style,
      message,
    });
  }

  return responses;
}

/**
 * Get color for emotion
 */
export function emotionToColor(emotion?: string): string | undefined {
  if (!emotion) return undefined;

  const colorMap: Record<string, string> = {
    happy: '#FFD700',
    sad: '#4169E1',
    angry: '#FF6347',
    anxious: '#DDA0DD',
    neutral: '#808080',
    excited: '#FF69B4',
    grateful: '#32CD32',
    disappointed: '#696969',
  };

  return colorMap[emotion.toLowerCase()] || undefined;
}

/**
 * Analyze emotions in diary content
 */
export async function analyzeEmotions(diaryContent: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;

  // Check if API key is properly configured
  if (!apiKey || apiKey.length < 20) {
    console.warn('⚠️  GOOGLE_API_KEY not configured or invalid, returning neutral emotion');
    return 'neutral';
  }

  try {
    console.log('🎭 Attempting emotion analysis using Gemini API...');
    return await ragService.analyzeEmotions(diaryContent);
  } catch (error) {
    console.error('❌ Emotion analysis failed:', error);
    return 'neutral';
  }
}

/**
 * Search for semantically similar past diaries (for reinterpretation context)
 */
export async function searchContextDiaries(
  diary: Diary,
  userId: string,
  limit: number = 1
): Promise<any[]> {
  console.log(`🔍 Searching for similar past diaries for context...`);
  return await vectorStore.searchSimilarDiaries(
    diary.text,
    userId,
    limit,
    diary.id // Exclude current diary from results
  );
}

/**
 * Find memory orb by diary ID
 */
export function findOrbByDiaryId(diaryId: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM memory_orbs WHERE diaryId = ?',
      [diaryId],
      (err, rows) => {
        if (err) reject(err);
        else {
          const orbs = (rows || []).map((orb: any) => ({
            ...orb,
            isReinterpreted: Boolean(orb.isReinterpreted),
            reinterpretationReplies: orb.reinterpretationReplies
              ? JSON.parse(orb.reinterpretationReplies)
              : undefined,
          }));
          resolve(orbs);
        }
      }
    );
  });
}

/**
 * Update memory orb
 */
export async function updateOrb(orbId: string, updates: any): Promise<any> {
  return orbService.updateOrb(orbId, updates);
}
