import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DiaryPaper } from '@/components/DiaryPaper';
import { Character } from '@/components/Character';
import { useDiary } from '@/hooks/useDiary';
import { useCharacters } from '@/hooks/useCharacters';

export const DiaryComplete: React.FC = () => {
  const { diaryId } = useParams<{ diaryId: string }>();
  const navigate = useNavigate();
  const { diary, loadDiary, isLoading } = useDiary();
  const { characters, loadCharacters } = useCharacters();
  const [showCharacters, setShowCharacters] = useState(false);

  useEffect(() => {
    if (diaryId) {
      loadDiary(diaryId);
      loadCharacters();
      
      // Show characters after a delay
      setTimeout(() => {
        setShowCharacters(true);
      }, 1000);
    }
  }, [diaryId, loadDiary, loadCharacters]);

  if (isLoading || !diary) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const empatheticComments = [
    '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.',
    '이런 일이 있으셨군요. 함께 아파하고 있어요.',
    '당신의 마음을 들려주셔서 감사합니다. 함께 해요.',
  ];

  return (
    <div className="mobile-container min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-6">
      {/* Diary Paper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <DiaryPaper diary={diary} />
      </motion.div>

      {/* AI Characters */}
      <div className="mt-8 flex flex-wrap justify-center gap-6">
        {characters.slice(0, 3).map((character, index) => (
          <Character
            key={character.id}
            character={character}
            message={empatheticComments[index] || '소중한 하루였네요.'}
            isVisible={showCharacters}
            slideDirection={index % 2 === 0 ? 'left' : 'right'}
            delay={index * 0.2}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 space-y-3">
        <button
          onClick={() => navigate('/home')}
          className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold active:bg-purple-600"
        >
          홈으로 가기
        </button>
        <button
          onClick={() => navigate(`/reinterpret/${diaryId}`)}
          className="w-full py-3 bg-pink-500 text-white rounded-xl font-semibold active:bg-pink-600"
        >
          과거 일기 다시 해석하기
        </button>
      </div>
    </div>
  );
};

