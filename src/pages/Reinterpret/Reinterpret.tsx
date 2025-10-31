import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DiaryPaper } from '@/components/DiaryPaper';
import { Character } from '@/components/Character';
import { ReplyInput } from '@/components/ReplyInput';
import { useDiary } from '@/hooks/useDiary';
import { useCharacters } from '@/hooks/useCharacters';
import { ReinterpretationPrompt } from '@/types';

export const Reinterpret: React.FC = () => {
  const { diaryId } = useParams<{ diaryId: string }>();
  const navigate = useNavigate();
  const { diary, loadDiary, isLoading } = useDiary();
  const { characters, getReinterpretationPrompt } = useCharacters();
  const [prompt, setPrompt] = useState<ReinterpretationPrompt | null>(null);
  const [showOrb, setShowOrb] = useState(true); // 페이지 로드 시 구슬 표시
  const [showPaper, setShowPaper] = useState(false); // 초기에는 일기 노트 숨김
  const [orbPosition, setOrbPosition] = useState(0); // 구슬 위치 (0: 위, 100: 아래)

  useEffect(() => {
    if (diaryId) {
      loadDiary(diaryId);
    }
  }, [diaryId, loadDiary]);

  useEffect(() => {
    const loadSimilarDiary = async () => {
      // TODO: Load similar past diary
      // For now, use current diary
      if (diary && characters.length > 0) {
        const character = characters[0]; // Use first character
        const reinterpretPrompt = await getReinterpretationPrompt(
          diary.content,
          character.id
        );
        if (reinterpretPrompt) {
          setPrompt(reinterpretPrompt);
        }
      }
    };

    if (diary && characters.length > 0) {
      loadSimilarDiary();
    }
  }, [diary, characters, getReinterpretationPrompt]);

  // 구슬이 위에서 내려오다 중간에서 일기 노트로 전환
  useEffect(() => {
    if (!diary) return;

    // 구슬이 화면 위에서 시작하여 아래로 굴러내려옴
    const startAnimation = () => {
      let progress = 0;
      const duration = 2000; // 2초 동안 애니메이션
      const midpoint = 40; // 화면의 40% 지점에서 전환 시작
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        // 진행도에 따라 위치 계산 (0% → 100%)
        const position = progress * 100;
        setOrbPosition(position);

        // 중간 지점 도달 시 일기 노트 나타남
        if (progress * 100 >= midpoint && !showPaper) {
          setShowPaper(true);
        }

        // 애니메이션 완료 후 구슬 숨김
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            setShowOrb(false);
          }, 500);
        }
      };

      animate();
    };

    startAnimation();
  }, [diary, showPaper]);

  const handleReplySubmit = async (_reply: string) => {
    // Animate diary to orb
    setShowPaper(false);
    
    setTimeout(() => {
      setShowOrb(true);
    }, 500);

    // Mark orb as reinterpreted
    if (diary) {
      // TODO: Find related orb by diaryId and mark as reinterpreted via memory orbs service
    }

    // After animation, navigate to home
    setTimeout(() => {
      navigate('/home');
    }, 3000);
  };

  if (isLoading || !diary) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6 relative overflow-hidden">
      {/* Glitter Orb Animation - 위에서 아래로 굴러 내려옴 */}
      <AnimatePresence>
        {showOrb && (
          <motion.div
            className="fixed left-1/2 transform -translate-x-1/2 z-50"
            style={{
              top: `${orbPosition}vh`,
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: orbPosition > 50 ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 shadow-2xl"
              animate={{ 
                rotate: orbPosition * 3.6, // 굴러가는 효과
              }}
              transition={{ 
                duration: 0.1,
                ease: 'linear'
              }}
            >
              {/* Glitter particles */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos((i / 20) * Math.PI * 2) * 100],
                    y: [0, Math.sin((i / 20) * Math.PI * 2) * 100],
                    opacity: [1, 0],
                    scale: [1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diary Paper - 구슬이 중간 지점 도달 시 나타남 */}
      <AnimatePresence>
        {showPaper && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <DiaryPaper diary={diary} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Prompt */}
      {prompt && showPaper && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Character
            character={characters.find(c => c.id === prompt.characterId) || characters[0]}
            message={prompt.prompt}
            isVisible={true}
            slideDirection="bottom"
          />
        </motion.div>
      )}

      {/* Reply Input */}
      {prompt && showPaper && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <ReplyInput onSubmit={handleReplySubmit} />
        </motion.div>
      )}

    </div>
  );
};
