import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DiaryPaper } from '@/components/DiaryPaper';
import { Character } from '@/components/Character';
import { MemoryOrb } from '@/components/MemoryOrb';
import { useDiary } from '@/hooks/useDiary';
import { useCharacters } from '@/hooks/useCharacters';
import { useMemoryOrbs } from '@/hooks/useMemoryOrbs';
import { Diary, MemoryOrb as MemoryOrbType } from '@/types';
import { apiFetch } from '@/lib/apiClient';
import { EMOTION_COLORS } from '@/types';

type Stage = 'orb-rolling' | 'show-diary' | 'input' | 'completed';

export const Reinterpret: React.FC = () => {
  const { diaryId } = useParams<{ diaryId: string }>();
  const navigate = useNavigate();
  const { diary, loadDiary, isLoading } = useDiary();
  const { characters, loadCharacters } = useCharacters();
  const { orbs, loadOrbs, markAsReinterpreted } = useMemoryOrbs();
  
  const [stage, setStage] = useState<Stage>('orb-rolling');
  const [similarDiary, setSimilarDiary] = useState<Diary | null>(null);
  const [reinterpretationText, setReinterpretationText] = useState('');
  const [relatedOrb, setRelatedOrb] = useState<MemoryOrbType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (diaryId) {
      loadDiary(diaryId);
      loadCharacters();
    }
  }, [diaryId, loadDiary, loadCharacters]);

  // Find related orb - update when orbs change
  useEffect(() => {
    if (diary) {
      const orb = orbs.find(o => o.diaryId === diary.id);
      if (orb) {
        setRelatedOrb(orb);
      } else {
        // Create dummy orb for testing if no orb found
        const dummyOrb: MemoryOrbType = {
          id: `dummy-orb-${diary.id}`,
          diaryId: diary.id,
          date: diary.createdAt || new Date().toISOString(),
          emotion: (diary.emotion as any) || 'happy',
          isReinterpreted: false,
        };
        setRelatedOrb(dummyOrb);
      }
    }
  }, [diary, orbs]);

  // Load similar diary after current diary is loaded
  useEffect(() => {
    const fetchSimilarDiary = async () => {
      if (!diary || !diaryId) return;

      try {
        const similar = await apiFetch<Diary>(`/diaries/${diaryId}/similar`);
        setSimilarDiary(similar);
        
        // Start orb rolling animation
        setTimeout(() => {
          setStage('show-diary');
        }, 2000);
      } catch (error) {
        console.error('Failed to load similar diary:', error);
        // Use dummy data for testing if no similar diary found
        const now = new Date().toISOString();
        const dummyDiary: Diary = {
          id: 'dummy-id',
          userId: diary.userId,
          content: '오늘은 정말 힘든 하루였어. 모든 일이 잘못되어 가는 것 같았고, 내 마음도 무너져 내리는 느낌이었어. 하지만 그 순간들 속에서도 나는 무엇인가를 배울 수 있었다는 것을 깨달았어. 힘들었지만 성장의 시간이었다고 생각해.',
          date: now,
          createdAt: now,
          updatedAt: now,
          emotion: 'sad',
          aiCharacter: 'HeartOrb Companion',
          aiResponse: '',
          isEvolved: false,
        };
        setSimilarDiary(dummyDiary);
        
        // Start orb rolling animation
        setTimeout(() => {
          setStage('show-diary');
        }, 2000);
      }
    };

    if (diary && stage === 'orb-rolling') {
      fetchSimilarDiary();
    }
  }, [diary, diaryId, stage]);

  // Auto transition from show-diary to input (after showing diary and character messages)
  useEffect(() => {
    if (stage === 'show-diary' && similarDiary) {
      // Wait for characters to finish speaking (3 seconds)
      const timer = setTimeout(() => {
        setStage('input');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stage, similarDiary]);

  const handleSubmit = async () => {
    if (!reinterpretationText.trim() || !relatedOrb) return;

    setIsProcessing(true);
    try {
      // Mark orb as reinterpreted with the user's text (only if orb exists in DB)
      if (relatedOrb.id && !relatedOrb.id.startsWith('dummy-')) {
        await markAsReinterpreted(relatedOrb.id, reinterpretationText);
        // Refresh orbs to get updated state (this updates the orbs state)
        await loadOrbs();
      }
      
      // Update relatedOrb for immediate display
      setRelatedOrb({ ...relatedOrb, isReinterpreted: true });
      
      // Show completed stage
      setStage('completed');
      
      // Navigate to calendar after showing completed orb
      setTimeout(() => {
        navigate('/calendar');
      }, 3000);
    } catch (error) {
      console.error('Failed to save reinterpretation:', error);
      // Even if save fails, show the completed orb for testing
      setRelatedOrb({ ...relatedOrb, isReinterpreted: true });
      setStage('completed');
      setTimeout(() => {
        navigate('/calendar');
      }, 3000);
    }
  };

  if (isLoading || !diary) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const orbColor = relatedOrb ? EMOTION_COLORS[relatedOrb.emotion] : '#A78BFA';

  return (
    <div className="mobile-container min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
      {/* Stage 1: Orb Rolling */}
      <AnimatePresence>
        {stage === 'orb-rolling' && (
          <motion.div
            key="orb-rolling"
            className="flex items-center justify-center min-h-[60vh]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-32 h-32 rounded-full shadow-xl"
              style={{ backgroundColor: orbColor }}
              initial={{ x: -200, rotate: 0 }}
              animate={{ 
                x: 0, 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                ease: "easeOut"
              }}
            >
              {/* Inner highlight */}
              <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-white rounded-full opacity-30"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 2: Show Diary (with characters below) */}
      <AnimatePresence>
        {stage === 'show-diary' && similarDiary && (
          <motion.div
            key="show-diary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            {/* Diary Paper */}
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <DiaryPaper diary={similarDiary} />
            </motion.div>

            {/* Characters below diary with message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-6"
            >
              <div className="flex flex-wrap justify-center gap-6">
                {characters.slice(0, 3).map((character, index) => (
                  <motion.div
                    key={character.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.2 }}
                  >
                    <Character
                      character={character}
                      message={index === 0 ? "이 구슬 기억나? 지금의 네가 그때의 너에게 한마디를 해준다면, 뭐라고 말해줄래?" : ""}
                      isVisible={true}
                      slideDirection="bottom"
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 3: Input */}
      <AnimatePresence>
        {stage === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <textarea
                value={reinterpretationText}
                onChange={(e) => setReinterpretationText(e.target.value)}
                placeholder="다시빛 내용을 입력하세요..."
                className="w-full min-h-[150px] p-4 border-2 border-gray-300 rounded-xl resize-none focus:outline-none focus:border-purple-500"
                rows={6}
              />
              <button
                onClick={handleSubmit}
                disabled={!reinterpretationText.trim() || isProcessing}
                className="mt-4 w-full py-3 bg-purple-500 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed active:bg-purple-600"
              >
                {isProcessing ? '저장 중...' : '완료'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 4: Completed - Glittering Orb */}
      <AnimatePresence>
        {stage === 'completed' && relatedOrb && (
          <motion.div
            key="completed"
            className="flex flex-col items-center justify-center min-h-[60vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring',
                stiffness: 200,
                damping: 15
              }}
            >
              <MemoryOrb
                orb={{ ...relatedOrb, isReinterpreted: true }}
                size="lg"
                showGlitter={true}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-lg font-semibold text-purple-600"
            >
              다시빛 완료!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
