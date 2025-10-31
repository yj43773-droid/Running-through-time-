import React from 'react';
import { Diary } from '@/types';

interface DiaryPaperProps {
  diary: Diary;
  className?: string;
}

export const DiaryPaper: React.FC<DiaryPaperProps> = ({ diary, className = '' }) => {
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
          {diary.content}
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

