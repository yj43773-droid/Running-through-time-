import { useState, useCallback, useMemo } from 'react';
import { MemoryOrb, EmotionType, CalendarEntry, ReinterpretationReply } from '@/types';
import { apiFetch, ApiError } from '@/lib/apiClient';

interface MemoryOrbApiResponse {
  id: string;
  diaryId: string;
  userId: string;
  emotion: string;
  date: string;
  isReinterpreted?: boolean;
  reinterpretationNote?: string | null;
  reinterpretationReplies?: ReinterpretationReply[] | null;
  createdAt?: string;
  updatedAt?: string;
}

const normalizeOrb = (payload: MemoryOrbApiResponse): MemoryOrb => {
  const emotion = (payload.emotion ?? 'happy') as EmotionType;
  return {
    id: payload.id,
    diaryId: payload.diaryId,
    date: payload.date,
    emotion,
    isReinterpreted: Boolean(payload.isReinterpreted),
    reinterpretationNote: payload.reinterpretationNote ?? undefined,
    reinterpretationReplies: payload.reinterpretationReplies ?? undefined,
    glitterEffect: false,
  };
};

export const useMemoryOrbs = () => {
  const [orbs, setOrbs] = useState<MemoryOrb[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrbs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
<<<<<<< HEAD
      const response = await apiFetch<{ items: MemoryOrbApiResponse[] }>('/orbs');
      const mapped = response.items.map(normalizeOrb);
      setOrbs(mapped);
=======
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
>>>>>>> 8913d1cffc4b15e196b335b0b3bd35e7ff84dfc9
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '메모리 구슬을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addOrb = useCallback(async (diaryId: string, emotion: EmotionType, date: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch<MemoryOrbApiResponse>('/orbs', {
        method: 'POST',
        body: { diaryId, emotion, date },
      });
      const newOrb = normalizeOrb(response);
      setOrbs(prev => [...prev, newOrb]);
      return newOrb;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '메모리 구슬 생성에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsReinterpreted = useCallback(async (orbId: string, reinterpretationNote?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch<MemoryOrbApiResponse>(`/orbs/${orbId}/reinterpret`, {
        method: 'POST',
        body: reinterpretationNote ? { reinterpretationNote } : {},
      });
      const updatedOrb = normalizeOrb(response);
      setOrbs(prev =>
        prev.map(orb =>
          orb.id === orbId
            ? {
                ...orb,
                ...updatedOrb,
                glitterEffect: true,
              }
            : orb
        )
      );
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '메모리 구슬 업데이트에 실패했습니다.';
      setError(message);
      throw err;
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
