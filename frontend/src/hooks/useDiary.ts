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
      const response = await apiFetch<DiaryApiResponse>(`/diaries/${diaryId}`);
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

        if (targetId) {
          response = await apiFetch<DiaryApiResponse>(`/diaries/${targetId}`, {
            method: 'PATCH',
            body: baseBody,
          });
        } else {
          response = await apiFetch<DiaryApiResponse>('/diaries', {
            method: 'POST',
            body: baseBody,
          });
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

  const deleteDiary = useCallback(async (diaryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiFetch(`/diaries/${diaryId}`, {
        method: 'DELETE',
      });
      resetDiary();
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : '일기 삭제에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [resetDiary]);

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
    deleteDiary,
  };
};
