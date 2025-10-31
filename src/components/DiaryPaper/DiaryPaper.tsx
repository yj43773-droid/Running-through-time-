import React from 'react';
import { Diary } from '@/types';

interface DiaryPaperProps {
  diary: Diary;
  className?: string;
  highlightedText?: string; // 하이라이트할 텍스트
  highlightColor?: string; // 하이라이트 색상
}

export const DiaryPaper: React.FC<DiaryPaperProps> = ({ 
  diary, 
  className = '',
  highlightedText,
  highlightColor = '#FFF59D'
}) => {
  // 하이라이트할 텍스트가 있으면 해당 부분을 하이라이트
  const renderContentWithHighlight = () => {
    if (!highlightedText || !diary.content) {
      return diary.content;
    }

    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    const content = diary.content;
    const highlight = highlightedText;

    // 대소문자 구분 없이 검색
    let searchIndex = 0;
    while (searchIndex < content.length) {
      const index = content.toLowerCase().indexOf(highlight.toLowerCase(), searchIndex);
      if (index === -1) break;

      // 하이라이트 이전 텍스트
      if (index > lastIndex) {
        parts.push(content.substring(lastIndex, index));
      }

      // 하이라이트 텍스트
      const highlightedPart = content.substring(index, index + highlight.length);
      parts.push(
        <mark
          key={`highlight-${index}`}
          className="rounded px-1 transition-all duration-300"
          style={{
            backgroundColor: highlightColor,
            fontWeight: '600',
          }}
        >
          {highlightedPart}
        </mark>
      );

      lastIndex = index + highlight.length;
      searchIndex = index + 1;
    }

    // 남은 텍스트
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : diary.content;
  };

  return (
    <div className={`bg-paper bg-cover bg-center rounded-lg p-6 shadow-xl ${className}`}>
      {/* Paper texture background */}
      <div className="bg-white bg-opacity-90 rounded-lg p-6 min-h-[300px]">
        {/* Date */}
        <div className="text-xs text-gray-500 mb-4">
          {new Date(diary.date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </div>

        {/* Content */}
        <div
          className="text-gray-800 leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: diary.font || 'inherit' }}
        >
          {renderContentWithHighlight()}
        </div>

        {/* Photos */}
        {diary.photos && diary.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {diary.photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`일기 사진 ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

