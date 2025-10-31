import { useState, useCallback } from 'react';
import { Character, ReinterpretationPrompt, ReinterpretationReply } from '@/types';

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
          name: '위로',
          avatar: '/assets/characters/comfort.svg',
          personality: '따뜻하고 위로하는',
          color: '#FFD93D',
        },
        {
          id: 'char2',
          name: '공감',
          avatar: '/assets/characters/empathy.svg',
          personality: '깊이 공감하는',
          color: '#6BCAE2',
        },
        {
          id: 'char3',
          name: '격려',
          avatar: '/assets/characters/encourage.svg',
          personality: '용기를 주는',
          color: '#95E1D3',
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
