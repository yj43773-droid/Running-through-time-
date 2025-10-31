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
      
      // Mock data - 5 memory orbs for development
      const mockOrbs: MemoryOrb[] = [
        {
          id: '1',
          diaryId: 'diary-1',
          date: new Date().toISOString(),
          emotion: 'happy',
          isReinterpreted: false,
        },
        {
          id: '2',
          diaryId: 'diary-2',
          date: new Date(Date.now() - 86400000).toISOString(), // yesterday
          emotion: 'calm',
          isReinterpreted: true,
          glitterEffect: true,
        },
        {
          id: '3',
          diaryId: 'diary-3',
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          emotion: 'excited',
          isReinterpreted: false,
        },
        {
          id: '4',
          diaryId: 'diary-4',
          date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          emotion: 'grateful',
          isReinterpreted: false,
        },
        {
          id: '5',
          diaryId: 'diary-5',
          date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
          emotion: 'sad',
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

