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
  const { diary, loadDiary, isLoading, deleteDiary } = useDiary();
  const { characters, loadCharacters } = useCharacters();
  const { orbs, loadOrbs } = useMemoryOrbs();
  const [replies, setReplies] = useState<ReinterpretationReply[]>([]);
  const [reinterpretationNote, setReinterpretationNote] = useState<string | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (diaryId) {
      loadDiary(diaryId);
      loadCharacters();
    }
  }, [diaryId, loadDiary, loadCharacters]);

  // Find orb and get reinterpretation data
  useEffect(() => {
    if (diaryId) {
      const orb = orbs.find(o => o.diaryId === diaryId);
      if (orb) {
        // Set reinterpretation note if it exists
        if (orb.reinterpretationNote) {
          setReinterpretationNote(orb.reinterpretationNote);
        }
        // Set replies if they exist
        if (orb.reinterpretationReplies) {
          setReplies(orb.reinterpretationReplies);
        }
      }
    }
  }, [diaryId, orbs]);

  const handleDelete = async () => {
    if (!diaryId || !diary) return;
    
    const confirmed = window.confirm('정말 이 일기를 삭제하시겠습니까?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteDiary(diaryId);
      // 구슬 목록 새로고침 (구슬은 CASCADE로 자동 삭제됨)
      await loadOrbs();
      // 캘린더 페이지로 이동
      navigate('/calendar');
    } catch (error) {
      alert('일기 삭제에 실패했습니다.');
      setIsDeleting(false);
    }
  };

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
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 text-lg mr-4"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold">일기 상세</h1>
        </div>
        <motion.button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isDeleting ? '삭제 중...' : '삭제'}
        </motion.button>
      </header>

      {/* Diary Paper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DiaryPaper diary={diary} />
      </motion.div>

      {/* Original Characters (from diary complete) - 일기 작성 당시 생성된 응답 */}
      {(() => {
        const personaResponses = diary.aiPersonaResponses;
        if (!personaResponses || !Array.isArray(personaResponses) || personaResponses.length === 0) {
          return null;
        }

        interface PersonaResponse {
          persona?: string;
          label?: string;
          message: string;
        }

        const validResponses = personaResponses.filter(
          (r): r is PersonaResponse =>
            typeof r === 'object' &&
            r !== null &&
            'message' in r &&
            typeof (r as any).message === 'string'
        );

        if (validResponses.length === 0) {
          return null;
        }

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <div className="space-y-4">
              {validResponses.map((response, index) => {
                // 캐릭터 정보 찾기 (persona key나 label로 매칭)
                const character = characters.find(c => {
                  if (response.persona === 'gentle' || response.label?.includes('루미')) {
                    return c.name === '루미';
                  } else if (response.persona === 'pragmatic' || response.label?.includes('제트')) {
                    return c.name === '제트';
                  } else if (response.persona === 'humorous' || response.label?.includes('모카')) {
                    return c.name === '모카';
                  }
                  return false;
                });

                // 캐릭터를 찾지 못하면 기본 캐릭터 사용
                const defaultCharacter = characters[index] || characters[0];
                const displayCharacter = character || defaultCharacter;

                if (!displayCharacter) return null;

                return (
                  <Character
                    key={`${displayCharacter.id}-${index}`}
                    character={displayCharacter}
                    message={response.message || '소중한 하루였네요.'}
                    isVisible={true}
                    slideDirection="bottom"
                    delay={index * 0.1}
                  />
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* User's Reinterpretation Note */}
      {reinterpretationNote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-5 shadow-md border-2 border-purple-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <span className="font-semibold text-purple-700">내 다시빛</span>
            </div>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{reinterpretationNote}</p>
          </motion.div>
        </motion.div>
      )}

      {/* Reinterpretation Replies */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reinterpretationNote ? 0.8 : 0.6 }}
        className="mt-8"
      >
        {replies.length > 0 ? (
          <div className="space-y-4">
            {replies.map((reply) => {
              const character = characters.find(c => c.id === reply.characterId);
              if (!character) return null;

              return (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-200"
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
        ) : (
          !reinterpretationNote && (
            <div className="text-center text-gray-500 py-8">
              아직 다시빛 응답이 없습니다.
            </div>
          )
        )}
      </motion.div>
    </div>
  );
};

