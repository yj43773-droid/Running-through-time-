import { useState, useCallback } from 'react';
import { Character, ReinterpretationPrompt, ReinterpretationReply } from '@/types';
import pinkImage from '@/assets/pink.png';
import yellowImage from '@/assets/yellow.png';
import blueImage from '@/assets/blue.png';

export const useCharacters = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/characters');
      // const data = await response.json();
      // setCharacters(data);
      
      // Placeholder characters
      const mockCharacters: Character[] = [
        {
          id: 'char1',
          name: '루미',
          avatar: pinkImage,
          personality: '다정하고 공감력 높은 위로자',
          color: '#FF69B4', // Pink 색상
        },
        {
          id: 'char2',
          name: '모카',
          avatar: yellowImage,
          personality: '웃음으로 기분을 바꿔주는 분위기 메이커',
          color: '#FFD700', // Yellow 색상
        },
        {
          id: 'char3',
          name: '제트',
          avatar: blueImage,
          personality: '현실을 직시하게 도와주는 조언자',
          color: '#4169E1', // Blue 색상
        },
      ];
      setCharacters(mockCharacters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load characters');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCharacterById = useCallback((characterId: string) => {
    return characters.find(char => char.id === characterId);
  }, [characters]);

  const getReinterpretationPrompt = useCallback(async (
    diaryId: string,
    characterId: string
  ): Promise<ReinterpretationPrompt | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch context diary and character info
      const contextResponse = await fetch(`/api/diaries/${diaryId}/reinterpret/context`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', // Disable caching for fresh data
      });

      if (!contextResponse.ok) {
        throw new Error('Failed to fetch context diary');
      }

      const contextData = await contextResponse.json();
      const contextDiary = contextData.contextDiary;
      const character = getCharacterById(characterId);

      if (!character) return null;

      // Generate dynamic prompt based on context
      let prompt = `${character.name}이(가) 당신의 일기를 읽고 공감의 말을 건네려 합니다.\n\n`;

      if (contextDiary) {
        prompt += `${character.name}은 당신과 비슷한 감정의 예전 일기도 찾았습니다:\n`;
        prompt += `"${contextDiary.text.substring(0, 100)}..."\n`;
        prompt += `(${contextDiary.createdAt.split('T')[0]} 작성, 감정: ${contextDiary.emotion})\n\n`;
        prompt += `이 예전 일기를 보며 지금 당신의 감정에 대해 어떻게 생각하세요?`;
      } else {
        prompt += `당신의 감정을 이해하기 위해 이전 일기들을 살펴보았습니다.\n`;
        prompt += `지금 당신의 진정한 감정을 공유해주시겠어요?`;
      }

      const reinterpretationPrompt: ReinterpretationPrompt = {
        characterId,
        characterName: character.name,
        prompt,
        contextDiary, // Include the actual context diary data
      };

      return reinterpretationPrompt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get reinterpretation prompt');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCharacterById]);

  const submitReinterpretationReply = useCallback(async (
    diaryId: string,
    characterId: string,
    reply: string
  ): Promise<ReinterpretationReply | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // Submit reply to server
      const response = await fetch(`/api/diaries/${diaryId}/reinterpret/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, reply }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }

      await response.json();
      const character = getCharacterById(characterId);

      if (!character) return null;

      // Return reply data
      const replyData: ReinterpretationReply = {
        id: `reply-${Date.now()}`,
        characterId,
        characterName: character.name,
        message: reply,
        timestamp: new Date().toISOString(),
      };

      return replyData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit reply');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCharacterById]);

  return {
    characters,
    isLoading,
    error,
    loadCharacters,
    getCharacterById,
    getReinterpretationPrompt,
    submitReinterpretationReply,
  };
};
