import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiary } from '@/hooks/useDiary';
import { useMemoryOrbs } from '@/hooks/useMemoryOrbs';
import { EMOTION_COLORS, EmotionType } from '@/types';

export const DiaryWrite: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentContent,
    currentPhotos,
    currentFont,
    updateContent,
    setCurrentFont,
    addPhoto,
    removePhoto,
    saveDiary,
    resetDiary,
  } = useDiary();
  const { addOrb } = useMemoryOrbs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('happy');

  const fonts = [
    { value: 'default', label: '기본' },
    { value: 'serif', label: '명조체' },
    { value: 'monospace', label: '고정폭' },
    { value: 'cursive', label: '손글씨' },
  ];

  const emotionLabels: Record<EmotionType, string> = {
    happy: '기쁨',
    sad: '슬픔',
    angry: '화남',
    anxious: '불안',
    calm: '평온',
    excited: '설렘',
    grateful: '감사',
    lonely: '외로움',
  };

  const emotions = (Object.keys(EMOTION_COLORS) as EmotionType[]).map((emotion) => ({
    value: emotion,
    label: emotionLabels[emotion],
    color: EMOTION_COLORS[emotion],
  }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            addPhoto(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSTT = () => {
    // TODO: Implement STT voice input
    alert('STT 기능은 추후 구현 예정입니다.');
  };

  const handleComplete = async () => {
    if (!currentContent.trim()) {
      alert('일기 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const diary = await saveDiary({
        content: currentContent,
        photos: currentPhotos,
        font: currentFont,
      });

      if (diary) {
        await addOrb(diary.id, selectedEmotion as any, new Date().toISOString());
        resetDiary();
        navigate(`/diary/complete/${diary.id}`);
      }
    } catch (error) {
      alert('일기 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-container pb-20 min-h-screen">
      {/* Header */}
      <header className="safe-area-top bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 text-lg"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold">일기 쓰기</h1>
        <button
          onClick={handleComplete}
          disabled={isSubmitting || !currentContent.trim()}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '저장 중...' : '완료'}
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {/* Emotion Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            오늘의 감정
          </label>
          <div className="flex flex-wrap gap-2">
            {emotions.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => setSelectedEmotion(emotion.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedEmotion === emotion.value
                    ? 'ring-2 ring-purple-500 ring-offset-2'
                    : 'bg-gray-100'
                }`}
                style={{
                  backgroundColor:
                    selectedEmotion === emotion.value ? emotion.color : undefined,
                  color: selectedEmotion === emotion.value ? 'white' : 'black',
                }}
              >
                {emotion.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            폰트
          </label>
          <select
            value={currentFont}
            onChange={(e) => setCurrentFont(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
          >
            {fonts.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text Editor */}
        <div className="mb-4">
          <textarea
            value={currentContent}
            onChange={(e) => updateContent(e.target.value)}
            placeholder="오늘 하루는 어땠나요?"
            className="w-full min-h-[400px] p-4 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-purple-500"
            style={{ fontFamily: currentFont || 'inherit' }}
          />
        </div>

        {/* Photo Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사진
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-500"
          >
            📷 사진 추가
          </label>

          {/* Photo Preview */}
          {currentPhotos.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {currentPhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(photo)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STT Button */}
        <button
          onClick={handleSTT}
          className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold active:bg-blue-600"
        >
          🎤 음성으로 입력하기
        </button>
      </main>
    </div>
  );
};

