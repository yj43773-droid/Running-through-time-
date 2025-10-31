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
    label: '상냥한 공감러',
    style: '따뜻하고 포용적인 말투로 위로와 공감을 전합니다.',
    instruction: '사용자의 감정을 수용하고 편안함을 줄 수 있는 부드러운 말투로 짧은 답장을 작성하세요.',
  },
  {
    key: 'pragmatic',
    label: '현실적인 조언자',
    style: '현실적이고 명확한 조언을 제공합니다.',
    instruction: '문제 해결에 도움이 되는 구체적인 조언을 2~3문장으로 제시하세요.',
  },
  {
    key: 'humorous',
    label: '유머러스한 친구',
    style: '가볍고 재치있는 농담으로 분위기를 전환합니다.',
    instruction: '상황을 가볍게 풀어 주되, 공감을 잃지 않는 선에서 재치 있게 답변하세요.',
  },
];

export function generateMockResponses(diary: Diary, similarDiaries: any[] = []): PersonaResponse[] {
  const topReference = similarDiaries[0];
  const refText = topReference
    ? ` 비슷한 과거 일기(${topReference.id})가 있어 함께 떠올려 봤어요.`
    : '';

  const responses: PersonaResponse[] = [];

  for (const persona of PERSONAS) {
    let message = '';

    if (persona.key === 'gentle') {
      message = `너무 수고했어요. 지금 느끼는 감정을 충분히 느껴도 괜찮아요.${refText}`;
    } else if (persona.key === 'pragmatic') {
      message = `지금 상황을 한 걸음 떨어져서 바라보면 도움이 될 수 있어요. 작은 행동부터 시작해 볼까요?${refText}`;
    } else {
      message = `이럴 땐 스스로를 위해 초콜릿 하나쯤은 괜찮지 않을까요? 😉${refText}`;
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
