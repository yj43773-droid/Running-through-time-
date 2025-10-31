import { useState, useCallback } from 'react';
import { Diary } from '@/types';

export const useDiary = () => {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const [currentFont, setCurrentFont] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDiary = useCallback(async (diaryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/diaries/${diaryId}`);
      // const data = await response.json();
      // setDiary(data);
      
      // 예시 일기 데이터 - 테스트용
      const mockDiaries: Record<string, Diary> = {
        'diary-1': {
          id: 'diary-1',
          userId: 'user1',
          date: new Date().toISOString(),
          content: '오늘은 정말 즐거운 하루였다. 친구들과 함께 카페에 가서 대화를 나누고, 맛있는 케이크를 먹었다. 날씨도 좋고 분위기도 좋아서 하루 종일 웃음이 끊이지 않았다. 이런 소중한 순간들을 기록으로 남길 수 있어서 정말 행복하다.',
          photos: [],
          font: 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        'diary-2': {
          id: 'diary-2',
          userId: 'user1',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          content: '어제는 가족들과 함께 저녁을 먹었다. 엄마가 만들어준 음식이 평소보다 더 맛있었던 것 같다. 바쁘게 살아가면서도 가족과 함께 하는 시간을 만드는 것이 중요하다는 것을 다시 한 번 느꼈다. 감사한 마음을 가지게 되는 하루였다.',
          photos: [],
          font: 'default',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        'diary-3': {
          id: 'diary-3',
          userId: 'user1',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          content: '오늘은 조용한 날이었다. 창밖을 보면서 생각에 잠겼다. 평소보다 마음이 차분했고, 내 안의 목소리에 집중할 수 있었다. 때로는 이런 여유로운 시간이 필요하다는 것을 깨달았다.',
          photos: [],
          font: 'default',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'diary-4': {
          id: 'diary-4',
          userId: 'user1',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          content: '새로운 프로젝트를 시작했다. 처음에는 막막했지만, 하나씩 진행해나가니 점점 재미있어지기 시작한다. 도전은 항상 두렵지만, 그만큼 성장할 수 있는 기회이기도 하다. 이번에도 잘 해낼 수 있을 것 같다!',
          photos: [],
          font: 'default',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'diary-5': {
          id: 'diary-5',
          userId: 'user1',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          content: '오늘은 조금 힘든 하루였다. 하고 싶었던 일들이 계획대로 되지 않았고, 기대했던 것과 다른 결과가 나왔다. 하지만 이런 날도 있다는 것을 받아들이고, 내일을 위해 다시 마음을 다잡아야 한다.',
          photos: [],
          font: 'default',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'diary-6': {
          id: 'diary-6',
          userId: 'user1',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          content: '오늘 점심은 혼자서 먹었다. 가끔은 혼자만의 시간도 좋다. 생각 정리를 할 수 있고, 내가 원하는 대로 시간을 보낼 수 있어서 편안했다.',
          photos: [],
          font: 'default',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'diary-7': {
          id: 'diary-7',
          userId: 'user1',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          content: '저녁에는 오랜만에 연락 온 친구와 전화 통화를 했다. 각자의 이야기를 나누고 공감하면서 시간 가는 줄 몰랐다. 소중한 인연들이 있어서 감사하다.',
          photos: [],
          font: 'default',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'diary-8': {
          id: 'diary-8',
          userId: 'user1',
          date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          content: '주말에는 책을 읽으며 시간을 보냈다. 읽던 책이 점점 재미있어지기 시작했고, 주인공의 여정에 몰입했다. 독서는 내 마음을 차분하게 만들어주는 좋은 방법이다.',
          photos: [],
          font: 'default',
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'diary-9': {
          id: 'diary-9',
          userId: 'user1',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          content: '오늘은 뭔가 불안한 하루였다. 미래에 대한 걱정이 생겼고, 결정해야 할 일들이 많아서 머리가 아팠다. 하지만 걱정만 해서는 아무것도 해결되지 않는다는 것을 알고 있다. 하나씩 차근차근 해결해 나가야겠다.',
          photos: [],
          font: 'default',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        'diary-10': {
          id: 'diary-10',
          userId: 'user1',
          date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          content: '오늘 새로운 취미를 시작했다. 처음이라 어색했지만, 점점 재미있어지기 시작한다. 새로운 것을 배우는 과정은 항상 설레고, 내가 할 수 있을 것 같다는 자신감도 생긴다. 이번 주말에도 계속 해볼 예정이다!',
          photos: [],
          font: 'default',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
      
      const mockDiary: Diary = mockDiaries[diaryId] || {
        id: diaryId,
        userId: 'user1',
        date: new Date().toISOString(),
        content: '예시 일기입니다. 이 일기는 테스트용 데이터입니다.',
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setDiary(mockDiary);
      setCurrentContent(mockDiary.content);
      setCurrentPhotos(mockDiary.photos || []);
      setCurrentFont(mockDiary.font || 'default');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diary');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDiary = useCallback(async (diaryData: Partial<Diary>) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/diaries', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(diaryData),
      // });
      // const data = await response.json();
      
      // Placeholder
      const newDiary: Diary = {
        id: Date.now().toString(),
        userId: 'user1',
        date: new Date().toISOString(),
        content: diaryData.content || currentContent,
        photos: diaryData.photos || currentPhotos,
        font: diaryData.font || currentFont,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDiary(newDiary);
      return newDiary;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save diary');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentContent, currentPhotos, currentFont]);

  const updateContent = useCallback((content: string) => {
    setCurrentContent(content);
  }, []);

  const addPhoto = useCallback((photoUrl: string) => {
    setCurrentPhotos(prev => [...prev, photoUrl]);
  }, []);

  const removePhoto = useCallback((photoUrl: string) => {
    setCurrentPhotos(prev => prev.filter(p => p !== photoUrl));
  }, []);

  const resetDiary = useCallback(() => {
    setDiary(null);
    setCurrentContent('');
    setCurrentPhotos([]);
    setCurrentFont('default');
    setError(null);
  }, []);

  return {
    diary,
    currentContent,
    currentPhotos,
    currentFont,
    isLoading,
    error,
    loadDiary,
    saveDiary,
    updateContent,
    setCurrentFont,
    addPhoto,
    removePhoto,
    resetDiary,
  };
};

