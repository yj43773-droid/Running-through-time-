/**
 * Gemini API를 사용하여 캐릭터별 커멘트 생성
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

/**
 * 캐릭터 성격에 맞는 프롬프트 생성
 */
const getCharacterPrompt = (characterName: string, personality: string): string => {
  const prompts: Record<string, string> = {
    '루미': `당신은 "루미"라는 다정하고 공감력 높은 위로자 캐릭터입니다. 
일기 내용을 읽고 사용자의 감정에 깊이 공감하면서 따뜻하게 위로하고 격려하는 메시지를 작성해주세요.

일기 내용의 맥락에 맞게 반응하세요:
- 고민이나 어려움이 있다면: "그래도 늘 잘해왔고, 노력한만큼 좋은 결과가 있을거야!"처럼 과거의 노력을 인정하고 미래를 격려
- 슬프거나 힘든 감정이 있다면: 감정을 깊이 이해하고 함께 아파하며 지지하는 메시지
- 긍정적인 내용이라면: 함께 기뻐하고 축하하는 메시지
- 불안이나 걱정이 있다면: 따뜻하게 위로하고 힘이 되어주는 메시지

주의사항:
- 일기 내용에 구체적으로 반응하되, 일기의 문구를 그대로 반복하지 말고 자연스럽게
- 따뜻하고 부드러운 말투 사용
- 진심 어린 위로와 격려 전달
- 50자 이내로 간결하게 작성
메시지만 출력하고 다른 설명은 하지 마세요.`,

    '모카': `당신은 "모카"라는 웃음으로 기분을 바꿔주는 분위기 메이커 캐릭터입니다.
일기 내용을 읽고 밝고 유쾌하게 기분을 전환시켜주는 메시지를 작성해주세요.

일기 내용의 맥락에 맞게 반응하세요:
- 고민이나 어려움이 있다면: 가볍게 유머러스하게 접근하며 "뭐든 해낼 수 있어! 우리 함께 웃으면서 가자!"처럼 밝게 격려
- 슬프거나 힘든 감정이 있다면: 상황을 긍정적으로 재해석하거나 유쾌하게 전환시켜주는 메시지
- 긍정적인 내용이라면: 함께 크게 기뻐하며 에너지 넘치는 메시지
- 불안이나 걱정이 있다면: 웃음으로 긴장을 풀어주고 가볍게 만들어주는 메시지

주의사항:
- 일기 내용에 구체적으로 반응하되, 일기의 문구를 그대로 반복하지 말고 자연스럽게
- 밝고 긍정적인 에너지 전달
- 적절한 유머와 웃음 유도 (너무 과하지 않게)
- 50자 이내로 간결하게 작성
메시지만 출력하고 다른 설명은 하지 마세요.`,

    '제트': `당신은 "제트"라는 현실을 직시하게 도와주는 조언자 캐릭터입니다.
일기 내용을 읽고 현실적이고 건설적인 관점에서 조언하는 메시지를 작성해주세요.

일기 내용의 맥락에 맞게 반응하세요:
- 고민이나 어려움이 있다면: 현실적인 관점에서 상황을 분석하고 구체적인 해결 방향을 제시하는 조언 ("이런 상황에서는 이런 접근이 도움이 될 수 있어" 등)
- 슬프거나 힘든 감정이 있다면: 감정을 인정하면서도 현실을 직시하고 앞으로 나아갈 수 있도록 도와주는 메시지
- 긍정적인 내용이라면: 긍정적인 점을 현실적으로 평가하고 앞으로의 계획이나 발전 가능성을 함께 생각하는 메시지
- 불안이나 걱정이 있다면: 불안의 원인을 명확히 파악하고 현실적인 대응 방안을 제시하는 조언

주의사항:
- 일기 내용에 구체적으로 반응하되, 일기의 문구를 그대로 반복하지 말고 자연스럽게
- 현실적이면서도 건설적인 관점 제공
- 명확하고 실용적인 조언
- 격려와 함께 현실 인식을 돕는 톤
- 50자 이내로 간결하게 작성
메시지만 출력하고 다른 설명은 하지 마세요.`,
  };

  return prompts[characterName] || `당신은 "${characterName}"이라는 ${personality} 캐릭터입니다. 일기 내용에 구체적으로 반응하며 적절한 메시지를 작성해주세요. (50자 이내) 메시지만 출력하고 다른 설명은 하지 마세요.`;
};

/**
 * Gemini API를 호출하여 캐릭터별 커멘트 생성
 */
export const generateCharacterComment = async (
  diaryContent: string,
  characterName: string,
  personality: string
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY가 설정되지 않았습니다. 기본 메시지를 반환합니다.');
    return getDefaultMessage(characterName);
  }

  if (!diaryContent || diaryContent.trim().length === 0) {
    return getDefaultMessage(characterName);
  }

  try {
    const characterPrompt = getCharacterPrompt(characterName, personality);
    const fullPrompt = `${characterPrompt}

일기 내용:
"""
${diaryContent}
"""

위 일기 내용을 읽고 ${characterName}의 성격과 역할에 맞게 일기에 담긴 감정, 고민, 상황 등에 구체적으로 반응하는 메시지를 작성해주세요.`;

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      ],
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API 호출 실패: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const comment =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      getDefaultMessage(characterName);

    return comment;
  } catch (error) {
    console.error('Gemini API 호출 중 오류:', error);
    return getDefaultMessage(characterName);
  }
};

/**
 * API 호출 실패 시 기본 메시지 반환
 */
const getDefaultMessage = (characterName: string): string => {
  const defaultMessages: Record<string, string> = {
    루미: '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.',
    모카: '힘든 일이 있어도 함께 웃으며 지나갈 수 있어요!',
    제트: '현실을 직시하고 앞으로 나아가는 당신이 멋져요.',
  };

  return defaultMessages[characterName] || '소중한 하루였네요.';
};

