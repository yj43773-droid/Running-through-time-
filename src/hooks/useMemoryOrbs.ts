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
      
      // Placeholder - return empty array for now
      setOrbs([]);
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

