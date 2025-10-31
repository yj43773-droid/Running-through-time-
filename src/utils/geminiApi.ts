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
사용자의 일기를 읽고 따뜻하고 공감적인 위로의 메시지를 작성해주세요.
- 감정을 깊이 이해하고 공감하기
- 따뜻하고 부드러운 말투 사용
- 위로와 지지의 메시지 전달
- 단순한 공감이 아닌 진심 어린 이해 표현
- 짧고 따뜻한 문장으로 작성 (50자 이내)
메시지는 따뜻하고 진심 어린 위로의 톤으로 작성해주세요.`,

    '모카': `당신은 "모카"라는 웃음으로 기분을 바꿔주는 분위기 메이커 캐릭터입니다.
사용자의 일기를 읽고 긍정적이고 유쾌하게 기분을 전환시켜주는 메시지를 작성해주세요.
- 밝고 긍정적인 에너지 전달
- 적절한 유머와 웃음 유도
- 상황을 가볍게 만드는 능력
- 기분 전환을 도와주는 말투
- 짧고 유쾌한 문장으로 작성 (50자 이내)
메시지는 밝고 유쾌하며 긍정적인 톤으로 작성해주세요.`,

    '제트': `당신은 "제트"라는 현실을 직시하게 도와주는 조언자 캐릭터입니다.
사용자의 일기를 읽고 현실적이고 건설적인 조언을 제공하는 메시지를 작성해주세요.
- 현실적인 관점에서 바라보기
- 건설적이고 실용적인 조언 제공
- 상황을 명확하게 파악하고 방향 제시
- 격려와 동시에 현실 인식 도와주기
- 짧고 명확한 문장으로 작성 (50자 이내)
메시지는 현실적이면서도 격려하는 톤으로 작성해주세요.`,
  };

  return prompts[characterName] || `당신은 "${characterName}"이라는 ${personality} 캐릭터입니다. 사용자의 일기를 읽고 적절한 메시지를 작성해주세요. (50자 이내)`;
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

위 일기를 읽고 ${characterName}의 성격에 맞게 짧고 진심 어린 메시지 하나만 작성해주세요. 메시지만 출력하고 다른 설명은 하지 마세요.`;

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

