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
  const [activeCharacterIndex, setActiveCharacterIndex] = useState<number | null>(null);
  const [characterComments, setCharacterComments] = useState<string[]>([]);
  const [isGeneratingComments, setIsGeneratingComments] = useState(false);
  const [spokenMessages, setSpokenMessages] = useState<Record<number, string>>({}); // 각 캐릭터가 말한 메시지 저장

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

  // 일기와 캐릭터가 로드되면 Backend에서 가져온 AI 응답 사용
  useEffect(() => {
    if (diary && characters.length >= 3 && !isGeneratingComments) {
      setIsGeneratingComments(true);

      try {
        // Backend에서 이미 생성한 AI 응답 사용
        const aiResponses = diary.aiPersonaResponses as Array<{ message: string }> | undefined;

        if (aiResponses && Array.isArray(aiResponses) && aiResponses.length >= 3) {
          // Backend 응답이 있으면 사용
          const comments = aiResponses.slice(0, 3).map((response) => response.message);
          setCharacterComments(comments);
        } else {
          // 응답이 없으면 기본 메시지 사용
          setCharacterComments([
            '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.',
            '이런 일이 있으셨군요. 함께 아파하고 있어요.',
            '앞으로도 함께 걸어가요. 당신은 충분히 용기 있어요.',
          ]);
        }
      } catch (error) {
        console.error('AI 응답 로드 중 오류:', error);
        // 기본 메시지로 fallback
        setCharacterComments([
          '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.',
          '이런 일이 있으셨군요. 함께 아파하고 있어요.',
          '앞으로도 함께 걸어가요. 당신은 충분히 용기 있어요.',
        ]);
      } finally {
        setIsGeneratingComments(false);
      }
    }
  }, [diary, characters, isGeneratingComments]);

  // 캐릭터가 순차적으로 말하도록 설정
  useEffect(() => {
    if (!showCharacters || !diary || characters.length < 3 || characterComments.length === 0) return;

    const timeouts: number[] = [];

    // 기본 메시지 (fallback)
    const defaultMessages = [
      '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.',
      '이런 일이 있으셨군요. 함께 아파하고 있어요.',
      '앞으로도 함께 걸어가요. 당신은 충분히 용기 있어요.',
    ];
    
    const comments = characterComments.length > 0 ? characterComments : defaultMessages;

    // 첫 번째 캐릭터가 말하기 시작
    const timeout1 = setTimeout(() => {
      setActiveCharacterIndex(0);
      if (comments[0]) {
        setSpokenMessages(prev => ({ ...prev, 0: comments[0] }));
      }
    }, 1500);
    timeouts.push(timeout1);

    // 두 번째 캐릭터가 말하기
    const timeout2 = setTimeout(() => {
      setActiveCharacterIndex(1);
      if (comments[1]) {
        setSpokenMessages(prev => ({ ...prev, 1: comments[1] }));
      }
    }, 4000);
    timeouts.push(timeout2);

    // 세 번째 캐릭터가 말하기
    const timeout3 = setTimeout(() => {
      setActiveCharacterIndex(2);
      if (comments[2]) {
        setSpokenMessages(prev => ({ ...prev, 2: comments[2] }));
      }
    }, 6500);
    timeouts.push(timeout3);

    // 모든 캐릭터가 말한 후 (말풍선은 계속 유지)
    const timeout4 = setTimeout(() => {
      setActiveCharacterIndex(null);
    }, 9000);
    timeouts.push(timeout4);

    // 모든 캐릭터가 말한 후 자동으로 재해석 페이지로 이동
    const timeout5 = setTimeout(() => {
      if (diaryId) {
        navigate(`/reinterpret/${diaryId}`);
      }
    }, 10000);
    timeouts.push(timeout5);

    // Cleanup function
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [showCharacters, diary, characters, diaryId, navigate, characterComments]);

  if (isLoading || !diary) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // 생성된 커멘트가 있으면 사용, 없으면 기본 메시지
  const empatheticComments =
    characterComments.length > 0
      ? characterComments
      : [
          '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.',
          '이런 일이 있으셨군요. 함께 아파하고 있어요.',
          '앞으로도 함께 걸어가요. 당신은 충분히 용기 있어요.',
        ];

  return (
    <div className="mobile-container min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
      {/* Home Icon - 일기 종이 위, 왼쪽 위에 배치 */}
      <div className="mb-4 flex justify-start">
        <button
          onClick={() => navigate('/home')}
          className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          {/* 회색 집 아이콘 SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </button>
      </div>

      {/* Diary Paper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <DiaryPaper diary={diary} />
      </motion.div>

      {/* AI Characters */}
      <div className="mt-8 flex flex-wrap justify-center gap-8">
        {characters.slice(0, 3).map((character, index) => {
          const isSpeaking = activeCharacterIndex === index;
          // 말한 메시지가 있으면 계속 표시, 없으면 현재 말하고 있을 때만 표시
          const messageToShow = spokenMessages[index] || (isSpeaking ? (empatheticComments[index] || '소중한 하루였네요.') : undefined);
          return (
            <Character
              key={character.id}
              character={character}
              message={messageToShow}
              isVisible={showCharacters}
              slideDirection={index % 2 === 0 ? 'left' : 'right'}
              delay={index * 0.2}
              isSpeaking={isSpeaking}
            />
          );
        })}
      </div>

    </div>
  );
};

