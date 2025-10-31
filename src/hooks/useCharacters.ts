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
    diaryContent: string,
    characterId: string
  ): Promise<ReinterpretationPrompt | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/reinterpretation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ diaryContent, characterId }),
      // });
      // const data = await response.json();
      
      // Placeholder
      const character = getCharacterById(characterId);
      if (!character) return null;

      const prompt: ReinterpretationPrompt = {
        characterId,
        characterName: character.name,
        prompt: `${character.name}이(가) 당신의 일기를 읽고 공감의 말을 건네려 합니다...`,
      };

      return prompt;
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
      // TODO: Replace with actual API call
      // const response = await fetch('/api/reinterpretation/reply', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ diaryId, characterId, reply }),
      // });
      // const data = await response.json();
      
      // Placeholder
      const character = getCharacterById(characterId);
      if (!character) return null;

      const replyData: ReinterpretationReply = {
        id: Date.now().toString(),
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
