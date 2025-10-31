import { useState, useCallback } from 'react';
import { Diary, EmotionType } from '@/types';
import { apiFetch, ApiError } from '@/lib/apiClient';

interface DiaryApiResponse {
  id: string;
  userId: string;
  content?: string;
  text?: string;
  photos?: string[];
  font?: string;
  emotion?: string;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  aiCharacter?: string;
  aiResponse?: string;
  isEvolved?: boolean;
  reinterpretation?: string | null;
  evolvedEmotion?: string | null;
  emotionColor?: string | null;
  evolvedEmotionColor?: string | null;
  linkedPastDiaryId?: string | null;
  aiPersonaResponses?: unknown;
  similarDiaries?: unknown;
}

interface SaveDiaryParams {
  id?: string;
  content?: string;
  emotion: EmotionType | string;
  photos?: string[];
  font?: string;
  aiCharacter?: string;
  aiResponse?: string;
  reinterpretation?: string;
  isEvolved?: boolean;
  evolvedEmotion?: string;
  linkedPastDiaryId?: string | null;
}

const normalizeDiary = (
  payload: DiaryApiResponse,
  overrides?: Partial<Diary>,
): Diary => {
  const baseContent = payload.content ?? payload.text ?? '';
  const createdAt = payload.createdAt ?? payload.date ?? new Date().toISOString();
  const updatedAt = payload.updatedAt ?? createdAt;

  return {
    id: payload.id,
    userId: payload.userId,
    content: baseContent,
    date: payload.date ?? createdAt,
    createdAt,
    updatedAt,
    photos: payload.photos ?? overrides?.photos ?? [],
    font: payload.font ?? overrides?.font ?? 'default',
    emotion: (payload.emotion ?? overrides?.emotion) as EmotionType | undefined,
    aiCharacter: payload.aiCharacter ?? overrides?.aiCharacter,
    aiResponse: payload.aiResponse ?? overrides?.aiResponse,
    isEvolved: payload.isEvolved ?? overrides?.isEvolved,
    reinterpretation: payload.reinterpretation ?? overrides?.reinterpretation,
    evolvedEmotion: payload.evolvedEmotion ?? overrides?.evolvedEmotion,
    emotionColor: payload.emotionColor ?? overrides?.emotionColor,
    evolvedEmotionColor: payload.evolvedEmotionColor ?? overrides?.evolvedEmotionColor,
    linkedPastDiaryId: payload.linkedPastDiaryId ?? overrides?.linkedPastDiaryId,
    aiPersonaResponses:
      payload.aiPersonaResponses ?? overrides?.aiPersonaResponses,
    similarDiaries: payload.similarDiaries ?? overrides?.similarDiaries,
  };
};

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
      let response: DiaryApiResponse;
      
      // Try API first, fallback to localStorage
      try {
        response = await apiFetch<DiaryApiResponse>(`/diaries/${diaryId}`, {
          auth: false, // Allow loading without auth
        });
      } catch (apiError) {
        // API failed, try localStorage
        console.warn('API load failed, trying localStorage:', apiError);
        const storedDiaries = JSON.parse(localStorage.getItem('diaries') || '[]');
        const foundDiary = storedDiaries.find((d: DiaryApiResponse) => d.id === diaryId);
        
        if (!foundDiary) {
          throw new Error('일기를 찾을 수 없습니다.');
        }
        
        response = foundDiary;
      }
      
      const nextDiary = normalizeDiary(response);
      setDiary(nextDiary);
      setCurrentContent(nextDiary.content);
      setCurrentPhotos(nextDiary.photos ?? []);
      setCurrentFont(nextDiary.font ?? 'default');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '일기 불러오기에 실패했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDiary = useCallback(
    async (params: SaveDiaryParams) => {
      const targetEmotion =
        (params.emotion as EmotionType | undefined) ??
        (diary?.emotion as EmotionType | undefined);

      if (!targetEmotion) {
        throw new Error('감정을 선택해주세요.');
      }

      const payloadOverrides: Partial<Diary> = {
        photos: params.photos ?? currentPhotos,
        font: params.font ?? currentFont,
        emotion: targetEmotion,
      };

      setIsLoading(true);
      setError(null);

      try {
        const baseBody = {
          content: params.content ?? currentContent,
          emotion: targetEmotion,
          photos: params.photos ?? currentPhotos,
          font: params.font ?? currentFont,
          aiCharacter: params.aiCharacter ?? diary?.aiCharacter,
          aiResponse: params.aiResponse ?? diary?.aiResponse,
          reinterpretation: params.reinterpretation ?? diary?.reinterpretation,
          isEvolved: params.isEvolved ?? diary?.isEvolved,
          evolvedEmotion: params.evolvedEmotion ?? diary?.evolvedEmotion,
          linkedPastDiaryId:
            params.linkedPastDiaryId ?? diary?.linkedPastDiaryId,
        };

        let response: DiaryApiResponse;
        const targetId = params.id ?? diary?.id;

        // Try API first, fallback to localStorage
        try {
          if (targetId) {
            response = await apiFetch<DiaryApiResponse>(`/diaries/${targetId}`, {
              method: 'PATCH',
              body: baseBody,
              auth: false, // Allow saving without auth
            });
          } else {
            response = await apiFetch<DiaryApiResponse>('/diaries', {
              method: 'POST',
              body: baseBody,
              auth: false, // Allow saving without auth
            });
          }
        } catch (apiError) {
          // API failed, save to localStorage instead
          console.warn('API save failed, using localStorage:', apiError);
          
          const newId = targetId || `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date().toISOString();
          
          response = {
            id: newId,
            userId: 'local_user',
            content: baseBody.content,
            emotion: baseBody.emotion,
            photos: baseBody.photos,
            font: baseBody.font,
            createdAt: diary?.createdAt || now,
            updatedAt: now,
            date: now,
            aiCharacter: baseBody.aiCharacter,
            aiResponse: baseBody.aiResponse,
            reinterpretation: baseBody.reinterpretation,
            isEvolved: baseBody.isEvolved,
            evolvedEmotion: baseBody.evolvedEmotion,
            linkedPastDiaryId: baseBody.linkedPastDiaryId,
          };

          // Save to localStorage
          const storedDiaries = JSON.parse(localStorage.getItem('diaries') || '[]');
          const existingIndex = storedDiaries.findIndex((d: DiaryApiResponse) => d.id === newId);
          
          if (existingIndex >= 0) {
            storedDiaries[existingIndex] = response;
          } else {
            storedDiaries.push(response);
          }
          
          localStorage.setItem('diaries', JSON.stringify(storedDiaries));
        }

        const nextDiary = normalizeDiary(response, payloadOverrides);
        setDiary(nextDiary);
        setCurrentContent(nextDiary.content);
        setCurrentPhotos(nextDiary.photos ?? []);
        setCurrentFont(nextDiary.font ?? 'default');
        return nextDiary;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : '일기 저장에 실패했습니다.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentContent, currentPhotos, currentFont, diary],
  );

  const updateContent = useCallback((content: string) => {
    setCurrentContent(content);
  }, []);

  const addPhoto = useCallback((photoUrl: string) => {
    setCurrentPhotos((prev: string[]) => [...prev, photoUrl]);
  }, []);

  const removePhoto = useCallback((photoUrl: string) => {
    setCurrentPhotos((prev: string[]) => prev.filter((p: string) => p !== photoUrl));
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
