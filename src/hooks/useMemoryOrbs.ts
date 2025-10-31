import { useState, useCallback, useMemo } from 'react';
import { MemoryOrb, EmotionType, CalendarEntry } from '@/types';

export const useMemoryOrbs = () => {
  const [orbs, setOrbs] = useState<MemoryOrb[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrbs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/memory-orbs');
      // const data = await response.json();
      // setOrbs(data);
      
      // 예시 데이터 - 테스트용
      const today = new Date();
      const mockOrbs: MemoryOrb[] = [
        // 재해석된 구슬 (오늘)
        {
          id: 'orb-1',
          diaryId: 'diary-1',
          date: today.toISOString(),
          emotion: 'happy',
          isReinterpreted: true,
          glitterEffect: true,
        },
        // 재해석된 구슬 (어제)
        {
          id: 'orb-2',
          diaryId: 'diary-2',
          date: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          emotion: 'grateful',
          isReinterpreted: true,
          glitterEffect: true,
        },
        // 재해석되지 않은 구슬 (3일 전)
        {
          id: 'orb-3',
          diaryId: 'diary-3',
          date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          emotion: 'calm',
          isReinterpreted: false,
        },
        // 재해석된 구슬 (5일 전)
        {
          id: 'orb-4',
          diaryId: 'diary-4',
          date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          emotion: 'excited',
          isReinterpreted: true,
          glitterEffect: true,
        },
        // 재해석되지 않은 구슬 (7일 전)
        {
          id: 'orb-5',
          diaryId: 'diary-5',
          date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          emotion: 'sad',
          isReinterpreted: false,
        },
        // 같은 날짜에 여러 구슬 (10일 전)
        {
          id: 'orb-6',
          diaryId: 'diary-6',
          date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          emotion: 'happy',
          isReinterpreted: false,
        },
        {
          id: 'orb-7',
          diaryId: 'diary-7',
          date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          emotion: 'grateful',
          isReinterpreted: true,
          glitterEffect: true,
        },
        // 재해석된 구슬 (12일 전)
        {
          id: 'orb-8',
          diaryId: 'diary-8',
          date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          emotion: 'calm',
          isReinterpreted: true,
          glitterEffect: true,
        },
        // 재해석되지 않은 구슬 (15일 전)
        {
          id: 'orb-9',
          diaryId: 'diary-9',
          date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          emotion: 'anxious',
          isReinterpreted: false,
        },
        // 재해석된 구슬 (20일 전)
        {
          id: 'orb-10',
          diaryId: 'diary-10',
          date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          emotion: 'excited',
          isReinterpreted: true,
          glitterEffect: true,
        },
      ];
      
      setOrbs(mockOrbs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memory orbs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addOrb = useCallback(async (diaryId: string, emotion: EmotionType, date: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      const newOrb: MemoryOrb = {
        id: Date.now().toString(),
        diaryId,
        date,
        emotion,
        isReinterpreted: false,
      };
      
      setOrbs(prev => [...prev, newOrb]);
      return newOrb;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add memory orb');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsReinterpreted = useCallback(async (orbId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      setOrbs(prev =>
        prev.map(orb =>
          orb.id === orbId
            ? { ...orb, isReinterpreted: true, glitterEffect: true }
            : orb
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update memory orb');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOrbByDate = useCallback((date: string) => {
    return orbs.find(orb => orb.date === date);
  }, [orbs]);

  const getOrbsByEmotion = useCallback((emotion: EmotionType) => {
    return orbs.filter(orb => orb.emotion === emotion);
  }, [orbs]);

  const calendarEntries = useMemo(() => {
    const entriesMap = new Map<string, MemoryOrb[]>();
    
    orbs.forEach(orb => {
      const dateKey = orb.date.split('T')[0]; // Get YYYY-MM-DD format
      if (!entriesMap.has(dateKey)) {
        entriesMap.set(dateKey, []);
      }
      entriesMap.get(dateKey)!.push(orb);
    });

    const entries: CalendarEntry[] = Array.from(entriesMap.entries()).map(([date, orbs]) => ({
      date,
      orbs,
    }));

    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }, [orbs]);

  const orbStats = useMemo(() => {
    const stats: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      calm: 0,
      excited: 0,
      grateful: 0,
      lonely: 0,
    };

    orbs.forEach(orb => {
      stats[orb.emotion]++;
    });

    return stats;
  }, [orbs]);

  return {
    orbs,
    isLoading,
    error,
    loadOrbs,
    addOrb,
    markAsReinterpreted,
    getOrbByDate,
    getOrbsByEmotion,
    calendarEntries,
    orbStats,
  };
};

