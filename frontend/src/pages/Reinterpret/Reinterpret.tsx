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
  const { characters, loadCharacters, getReinterpretationPrompt, submitReinterpretationReply } = useCharacters();
  const [prompt, setPrompt] = useState<ReinterpretationPrompt | null>(null);
  const [showOrb, setShowOrb] = useState(false);
  const [showPaper, setShowPaper] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load characters
    loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    if (diaryId) {
      loadDiary(diaryId);
    }
  }, [diaryId, loadDiary]);

  useEffect(() => {
    const loadReinterpretationPrompt = async () => {
      if (diary && characters.length > 0 && diaryId) {
        const character = characters[0]; // Use first character (루미)
        const reinterpretPrompt = await getReinterpretationPrompt(diaryId, character.id);
        if (reinterpretPrompt) {
          setPrompt(reinterpretPrompt);
        }
      }
    };

    if (diary && characters.length > 0 && diaryId) {
      loadReinterpretationPrompt();
    }
  }, [diary, characters, diaryId, getReinterpretationPrompt]);

  const handleReplySubmit = async (reply: string) => {
    if (!diary || !prompt || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Submit reply to server
      const result = await submitReinterpretationReply(diary.id, prompt.characterId, reply);

      if (result) {
        // Animate diary to orb
        setShowPaper(false);

        setTimeout(() => {
          setShowOrb(true);
        }, 500);

        // After animation, navigate to home
        setTimeout(() => {
          navigate('/home');
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to submit reply:', error);
      setIsSubmitting(false);
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
    <div className="mobile-container min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-6">
      {/* Diary Paper */}
      <AnimatePresence>
        {showPaper && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
            transition={{ duration: 0.5 }}
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
          <ReplyInput onSubmit={handleReplySubmit} disabled={isSubmitting} />
        </motion.div>
      )}

      {/* Glitter Orb Animation */}
      <AnimatePresence>
        {showOrb && (
          <motion.div
            className="flex items-center justify-center min-h-[400px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ duration: 1, type: 'spring' }}
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
    </div>
  );
};
