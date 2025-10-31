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
      
      // Placeholder
      const mockDiary: Diary = {
        id: diaryId,
        userId: 'user1',
        date: new Date().toISOString(),
        content: '',
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

