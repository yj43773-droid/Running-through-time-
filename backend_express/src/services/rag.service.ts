import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchSimilarDiaries } from './vector-store.service';
import { Diary } from '../types';

interface PersonaResponse {
  persona: string;
  label: string;
  style: string;
  message: string;
}

const PERSONAS = [
  {
    key: 'gentle',
    label: '상냥한 공감러 (루미)',
    style: '따뜻하고 포용적인 말투로 위로와 공감을 전합니다.',
    instruction:
      '사용자의 감정을 수용하고 편안함을 줄 수 있는 부드러운 말투로 짧은 답장(2~3문장)을 작성하세요. 만약 비슷한 과거 일기가 있다면 그것을 언급하며 "그때도 힘들었지만 너는 이겨낼 수 있어"라는 메시지를 전달하세요.',
  },
  {
    key: 'pragmatic',
    label: '현실적인 조언자 (제트)',
    style: '현실적이고 명확한 조언을 제공합니다.',
    instruction:
      '문제 해결에 도움이 되는 구체적인 조언을 2~3문장으로 제시하세요. 과거 비슷한 상황에서 어떻게 해결했는지 참고하면서, 지금의 상황에 맞는 현실적인 조언을 해주세요.',
  },
  {
    key: 'humorous',
    label: '유머러스한 친구 (모카)',
    style: '가볍고 재치있는 농담으로 분위기를 전환합니다.',
    instruction:
      '상황을 가볍게 풀어 주되, 공감을 잃지 않는 선에서 재치 있게 답변하세요. 2~3문장 정도로 상황의 긍정적 측면을 찾아 유머러스하게 표현해 주세요.',
  },
];

let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize Google Generative AI
 */
function initializeGenAI(): GoogleGenerativeAI {
  if (genAI) return genAI;

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  GOOGLE_API_KEY not configured. Using template responses.');
    throw new Error('GOOGLE_API_KEY not available - using fallback templates');
  }

  if (apiKey.length < 20) {
    console.warn('⚠️  GOOGLE_API_KEY appears invalid (too short). Using template responses.');
    throw new Error('GOOGLE_API_KEY appears invalid - using fallback templates');
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Google Generative AI initialized successfully');
    return genAI;
  } catch (error) {
    console.error('❌ Failed to initialize Google Generative AI:', error);
    throw new Error('Failed to initialize Gemini API - using fallback templates');
  }
}

/**
 * Generate RAG-enhanced responses using similar diaries as context
 */
export async function generateRAGResponses(
  diary: Diary,
  userId: string
): Promise<PersonaResponse[]> {
  try {
    let genAIInstance: GoogleGenerativeAI;

    try {
      genAIInstance = initializeGenAI();
    } catch (initError) {
      console.warn('⚠️  Gemini API not available, using template responses');
      return generateTemplateResponses(diary);
    }

    // Search for similar diaries
    const similarDiaries = await searchSimilarDiaries(diary.text, userId, 2);

    const contextText =
      similarDiaries.length > 0
        ? `관련된 과거 일기들:\n${similarDiaries
            .map((d) => `- [${d.date}] 감정: ${d.emotion}`)
            .join('\n')}`
        : '관련된 과거 일기가 없습니다.';

    const responses: PersonaResponse[] = [];

    for (const persona of PERSONAS) {
      const prompt = `
당신은 "${persona.label}"이라는 AI 친구입니다.
성격: ${persona.style}

사용자의 일기:
감정: ${diary.emotion || '미분석'}
내용: ${diary.text}

${contextText}

위의 지시사항에 따라 따뜻하고 공감적인 답변을 작성하세요:
${persona.instruction}

답변은 반드시 2~3문장으로 작성하고, 한국어로 작성하세요.`;

      try {
        const model = genAIInstance.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const message = result.response.text();

        responses.push({
          persona: persona.key,
          label: persona.label,
          style: persona.style,
          message: message.trim(),
        });
      } catch (error) {
        console.error(`❌ Error generating response for ${persona.key}:`, error);
        console.warn(`⚠️  Falling back to template for ${persona.key}`);
        // Fallback to template response
        responses.push({
          persona: persona.key,
          label: persona.label,
          style: persona.style,
          message: getTemplateResponse(persona.key, diary, similarDiaries),
        });
      }
    }

    return responses;
  } catch (error) {
    console.error('❌ Error in RAG response generation:', error);
    // Return template responses as fallback
    console.warn('⚠️  Using template responses as final fallback');
    return generateTemplateResponses(diary);
  }
}

/**
 * Generate template responses (fallback)
 */
function generateTemplateResponses(diary: Diary): PersonaResponse[] {
  return PERSONAS.map((persona) => ({
    persona: persona.key,
    label: persona.label,
    style: persona.style,
    message: getTemplateResponse(persona.key, diary, []),
  }));
}

/**
 * Get template response for a persona
 */
function getTemplateResponse(
  personaKey: string,
  diary: Diary,
  similarDiaries: any[]
): string {
  const refText =
    similarDiaries.length > 0
      ? ` 비슷한 과거 일기를 찾아봤어요 - 그때도 잘 이겨냈잖아.`
      : '';

  switch (personaKey) {
    case 'gentle':
      return `너무 수고했어요. 지금 느끼는 감정을 충분히 느껴도 괜찮아요.${refText}`;
    case 'pragmatic':
      return `지금 상황을 한 걸음 떨어져서 바라보면 도움이 될 수 있어요. 작은 행동부터 시작해 볼까요?${refText}`;
    case 'humorous':
      return `이럴 땐 스스로를 위해 초콜릿 하나쯤은 괜찮지 않을까요? 😉${refText}`;
    default:
      return '공감해줘서 고마워요.';
  }
}

/**
 * Generate emotion analysis using Gemini
 */
export async function analyzeEmotions(diaryContent: string): Promise<string> {
  try {
    let genAIInstance: GoogleGenerativeAI;

    try {
      genAIInstance = initializeGenAI();
    } catch (initError) {
      console.warn('⚠️  Gemini API not available for emotion analysis, returning neutral');
      return '감정: neutral\n이유: API 미사용으로 기본값 반환';
    }

    const model = genAIInstance.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
다음의 일기 내용에서 주요 감정을 분석하세요.
happy(행복), sad(슬픔), angry(분노), anxious(불안), grateful(감사), excited(설렘), disappointed(실망) 중 하나를 선택하세요.

일기 내용:
${diaryContent}

응답은 다음 형식으로만 해주세요:
감정: [감정명]
이유: [한 문장 설명]`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('❌ Error analyzing emotions:', error);
    console.warn('⚠️  Using fallback emotion: neutral');
    return '감정: neutral\n이유: 감정 분석 실패로 기본값 반환';
  }
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
