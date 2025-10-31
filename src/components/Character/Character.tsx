import React from 'react';
import { motion } from 'framer-motion';
import { Character as CharacterType } from '@/types';

interface CharacterProps {
  character: CharacterType;
  message?: string;
  isVisible?: boolean;
  slideDirection?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  isSpeaking?: boolean; // 말하고 있는지 여부
  messagePosition?: 'left' | 'right'; // 말풍선 위치
}

export const Character: React.FC<CharacterProps> = ({
  character,
  message,
  isVisible = true,
  slideDirection = 'bottom',
  delay = 0,
  isSpeaking = false,
  messagePosition = 'right', // 기본값은 오른쪽
}) => {
  const slideVariants = {
    left: { x: -200, opacity: 0 },
    right: { x: 200, opacity: 0 },
    top: { y: -200, opacity: 0 },
    bottom: { y: 200, opacity: 0 },
  };

  const slideIn = {
    x: 0,
    y: 0,
    opacity: 1,
  };

  // 말풍선 위치에 따라 레이아웃 변경
  const isMessageLeft = messagePosition === 'left';

  return (
    <motion.div
      className={`flex items-center gap-4 relative ${isMessageLeft ? 'flex-row-reverse' : ''}`}
      initial={slideVariants[slideDirection]}
      animate={isVisible ? slideIn : slideVariants[slideDirection]}
      transition={{ delay, duration: 0.6, type: 'spring', stiffness: 100 }}
    >
      {/* Character avatar with name */}
      <div className="flex flex-col items-center gap-0">
        {/* Character image - 말할 때 크기 강조 */}
        <motion.div
          className="relative"
          animate={isSpeaking ? { scale: 1.3 } : { scale: 1 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
        >
          {character.avatar ? (
            <img
              src={character.avatar}
              alt={character.name}
              className="w-48 h-48 object-contain"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          {/* Fallback placeholder */}
          {!character.avatar && (
            <div
              className="w-48 h-48 flex items-center justify-center text-white text-xl font-bold rounded-full"
              style={{ 
                backgroundColor: character.color,
              }}
            >
              {character.name[0]}
            </div>
          )}
        </motion.div>

        {/* Character name - 간격 더 줄임 */}
        <div className="text-sm font-semibold -mt-1" style={{ color: character.color }}>
          {character.name}
        </div>
      </div>

      {/* Message bubble - 캐릭터 옆에 배치 */}
      {message && (
        <motion.div
          className="relative bg-white rounded-2xl px-4 py-3 shadow-lg max-w-xs"
          initial={{ scale: 0.8, opacity: 0, x: isMessageLeft ? 20 : -20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.3, duration: 0.3 }}
        >
          <p className="text-sm text-gray-700">{message}</p>
          
          {/* Speech bubble tail - 말풍선 위치에 따라 방향 변경 */}
          {isMessageLeft ? (
            // 왼쪽에 말풍선이 있을 때 - 오른쪽에서 왼쪽으로 향하는 꼬리
            <div
              className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent"
              style={{ borderLeftColor: 'white' }}
            />
          ) : (
            // 오른쪽에 말풍선이 있을 때 - 왼쪽에서 오른쪽으로 향하는 꼬리
            <div
              className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent"
              style={{ borderRightColor: 'white' }}
            />
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

