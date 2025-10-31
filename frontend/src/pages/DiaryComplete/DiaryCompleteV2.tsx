import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Character } from '@/components/Character';
import { useDiary } from '@/hooks/useDiary';
import { useCharacters } from '@/hooks/useCharacters';

export const DiaryCompleteV2: React.FC = () => {
  const { diaryId } = useParams<{ diaryId: string }>();
  const navigate = useNavigate();
  const { diary, loadDiary, isLoading } = useDiary();
  const { characters, loadCharacters } = useCharacters();
  const [showCharacters, setShowCharacters] = useState<boolean[]>([]);
  const [activeCharacterIndex, setActiveCharacterIndex] = useState<number | null>(null);
  const [characterComments, setCharacterComments] = useState<string[]>([]);
  const [isGeneratingComments, setIsGeneratingComments] = useState(false);

  useEffect(() => {
    if (diaryId) {
      loadDiary(diaryId);
      loadCharacters();
    }
  }, [diaryId, loadDiary, loadCharacters]);

  // 일기와 캐릭터가 로드되면 Backend에서 가져온 AI 응답 사용
  useEffect(() => {
    if (diary && characters.length >= 3 && !isGeneratingComments) {
      setIsGeneratingComments(true);

      try {
        // Backend에서 이미 생성한 AI 응답 사용
        const aiResponses = diary.aiPersonaResponses as Array<{ message: string; persona: string }> | undefined;

        if (aiResponses && Array.isArray(aiResponses) && aiResponses.length >= 3) {
          // 캐릭터 순서에 맞게 응답 정렬: 루미 → 제트 → 모카
          const characterOrderNames = ['gentle', 'pragmatic', 'humorous']; // Backend persona keys
          const orderedComments = characterOrderNames
            .map(persona => aiResponses.find(r => r.persona === persona)?.message)
            .filter((msg): msg is string => msg !== undefined);

          if (orderedComments.length >= 3) {
            setCharacterComments(orderedComments.slice(0, 3));
          } else {
            // 완전한 응답이 없으면 기본 메시지 사용
            setCharacterComments([
              '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.', // 루미
              '현실을 직시하고 앞으로 나아가는 당신이 멋져요.', // 제트
              '힘든 일이 있어도 함께 웃으며 지나갈 수 있어요!', // 모카
            ]);
          }
        } else {
          // 응답이 없으면 기본 메시지 사용
          setCharacterComments([
            '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.', // 루미
            '현실을 직시하고 앞으로 나아가는 당신이 멋져요.', // 제트
            '힘든 일이 있어도 함께 웃으며 지나갈 수 있어요!', // 모카
          ]);
        }
      } catch (error) {
        console.error('AI 응답 로드 중 오류:', error);
        // 기본 메시지로 fallback (순서: 루미 → 제트 → 모카)
        setCharacterComments([
          '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.', // 루미
          '현실을 직시하고 앞으로 나아가는 당신이 멋져요.', // 제트
          '힘든 일이 있어도 함께 웃으며 지나갈 수 있어요!', // 모카
        ]);
      } finally {
        setIsGeneratingComments(false);
      }
    }
  }, [diary, characters, isGeneratingComments]);

  // 캐릭터가 순차적으로 나타나고 말하도록 설정 (pink → blue → yellow)
  useEffect(() => {
    if (!diary || characters.length < 3 || characterComments.length === 0) return;

    const timeouts: number[] = [];

    // 첫 번째 캐릭터 (루미 - pink) 나타나고 말하기
    const timeout1 = setTimeout(() => {
      setShowCharacters([true, false, false]);
      setActiveCharacterIndex(0);
    }, 1500);
    timeouts.push(timeout1);

    // 두 번째 캐릭터 (제트 - blue) 나타나고 말하기
    const timeout2 = setTimeout(() => {
      setShowCharacters([true, true, false]);
      setActiveCharacterIndex(1);
    }, 4000);
    timeouts.push(timeout2);

    // 세 번째 캐릭터 (모카 - yellow) 나타나고 말하기
    const timeout3 = setTimeout(() => {
      setShowCharacters([true, true, true]);
      setActiveCharacterIndex(2);
    }, 6500);
    timeouts.push(timeout3);

    // 모든 캐릭터가 말한 후 (캐릭터는 계속 유지, 메시지만 제거)
    const timeout4 = setTimeout(() => {
      setActiveCharacterIndex(null);
      // 캐릭터들은 계속 유지 (showCharacters는 그대로)
    }, 9000);
    timeouts.push(timeout4);

    // Cleanup function
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [diary, characters, characterComments]);

  if (isLoading || !diary) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // 생성된 커멘트가 있으면 사용, 없으면 기본 메시지 (순서: 루미 → 제트 → 모카)
  const empatheticComments =
    characterComments.length > 0
      ? characterComments
      : [
          '오늘 하루 정말 수고하셨어요. 당신의 감정을 이해합니다.', // 루미 (pink)
          '현실을 직시하고 앞으로 나아가는 당신이 멋져요.', // 제트 (blue)
          '힘든 일이 있어도 함께 웃으며 지나갈 수 있어요!', // 모카 (yellow)
        ];

  // 캐릭터 위치 설정
  const getCharacterPosition = (characterName: string) => {
    switch (characterName) {
      case '루미': // pink - 왼쪽 위
        return 'top-8 left-8';
      case '제트': // blue - 오른쪽 중간
        return 'top-1/2 right-8 -translate-y-1/2';
      case '모카': // yellow - 아래 왼쪽
        return 'bottom-8 left-8';
      default:
        return 'top-8 left-8';
    }
  };

  // 캐릭터 순서: pink(루미) → blue(제트) → yellow(모카)
  const characterOrder = [
    characters.find(c => c.name === '루미'), // pink
    characters.find(c => c.name === '제트'), // blue
    characters.find(c => c.name === '모카'), // yellow
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  return (
    <div className="mobile-container fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-amber-50 to-amber-100">
      {/* Diary Paper - 전체 화면, 스크롤 가능 */}
      <motion.div
        className="absolute inset-0 w-full h-full overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-h-screen bg-paper bg-cover bg-center p-6 pb-0">
          {/* 일기 화면 (흰 종이) */}
          <div className="bg-white bg-opacity-90 rounded-lg p-6">
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
              className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base"
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

          {/* Action Buttons - 일기 화면 아래에 배치 */}
          <div className="mt-6 mb-8 space-y-3 px-6">
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
              재해석하기
            </button>
          </div>
        </div>
      </motion.div>

      {/* AI Characters - 일기 위에 오버레이, 나타난 후 계속 유지 */}
      <div className="absolute inset-0 pointer-events-none">
        {characterOrder.map((character, index) => {
          if (!character) return null;
          
          const isSpeaking = activeCharacterIndex === index;
          const isVisible = showCharacters[index] || false;
          
          // 캐릭터가 나타난 후 계속 유지 (한번 true가 되면 계속 표시)
          return (
            <div
              key={character.id}
              className={`absolute ${getCharacterPosition(character.name)} pointer-events-auto ${
                isVisible ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-500`}
            >
              <Character
                character={character}
                message={isSpeaking ? (empatheticComments[index] || '소중한 하루였네요.') : undefined}
                isVisible={true} // 한번 나타나면 계속 표시
                slideDirection="bottom"
                delay={0}
                isSpeaking={isSpeaking}
                messagePosition={character.name === '제트' ? 'left' : 'right'} // blue(제트)는 말풍선을 왼쪽에
              />
            </div>
          );
        })}
      </div>

    </div>
  );
};

