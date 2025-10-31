import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DiaryPaper } from '@/components/DiaryPaper';
import { Character } from '@/components/Character';
import { useDiary } from '@/hooks/useDiary';
import { useCharacters } from '@/hooks/useCharacters';
import { useMemoryOrbs } from '@/hooks/useMemoryOrbs';
import { ReinterpretationReply } from '@/types';

export const CalendarDetail: React.FC = () => {
  const { diaryId } = useParams<{ diaryId: string }>();
  const navigate = useNavigate();
  const { diary, loadDiary, isLoading } = useDiary();
  const { characters, loadCharacters } = useCharacters();
  const { orbs } = useMemoryOrbs();
  const [replies, setReplies] = useState<ReinterpretationReply[]>([]);

  useEffect(() => {
    if (diaryId) {
      loadDiary(diaryId);
      loadCharacters();

      // Find orb and get replies
      const orb = orbs.find(o => o.diaryId === diaryId);
      if (orb?.reinterpretationReplies) {
        setReplies(orb.reinterpretationReplies);
      }
    }
  }, [diaryId, loadDiary, loadCharacters, orbs]);

  if (isLoading || !diary) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 p-6">
      {/* Header */}
      <header className="mb-6 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 text-lg mr-4"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">일기 상세</h1>
      </header>

      {/* Diary Paper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DiaryPaper diary={diary} />
      </motion.div>

      {/* Original Characters (from diary complete) */}
      {characters.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <h2 className="text-lg font-semibold mb-4">AI 캐릭터의 응답</h2>
          <div className="space-y-4">
            {characters.slice(0, 3).map((character, index) => (
              <Character
                key={character.id}
                character={character}
                message="소중한 하루였네요."
                isVisible={true}
                slideDirection="bottom"
                delay={index * 0.1}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Reinterpretation Replies */}
      {replies.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold mb-4">재해석 응답</h2>
          <div className="space-y-4">
            {replies.map((reply) => {
              const character = characters.find(c => c.id === reply.characterId);
              if (!character) return null;

              return (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl p-4 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: character.color }}
                    >
                      {character.name[0]}
                    </div>
                    <span className="font-semibold" style={{ color: character.color }}>
                      {character.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(reply.timestamp).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-gray-700">{reply.message}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {replies.length === 0 && (
        <div className="mt-8 text-center text-gray-500">
          아직 재해석 응답이 없습니다.
        </div>
      )}
    </div>
  );
};

