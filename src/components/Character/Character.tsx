import React from 'react';
import { motion } from 'framer-motion';
import { Character as CharacterType } from '@/types';

interface CharacterProps {
  character: CharacterType;
  message?: string;
  isVisible?: boolean;
  slideDirection?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
}

export const Character: React.FC<CharacterProps> = ({
  character,
  message,
  isVisible = true,
  slideDirection = 'bottom',
  delay = 0,
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

  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      initial={slideVariants[slideDirection]}
      animate={isVisible ? slideIn : slideVariants[slideDirection]}
      transition={{ delay, duration: 0.6, type: 'spring', stiffness: 100 }}
    >
      {/* Character avatar */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
      >
        <div
          className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl"
          style={{
            borderColor: character.color,
            backgroundColor: `${character.color}20`,
          }}
        >
          {/* Placeholder for character image */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: character.color }}
          >
            {character.name[0]}
          </div>
        </div>
      </motion.div>

      {/* Character name */}
      <div className="text-sm font-semibold" style={{ color: character.color }}>
        {character.name}
      </div>

      {/* Message bubble */}
      {message && (
        <motion.div
          className="relative bg-white rounded-2xl px-4 py-3 shadow-lg max-w-xs"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
        >
          <p className="text-sm text-gray-700">{message}</p>
          
          {/* Speech bubble tail */}
          <div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
            style={{ borderTopColor: 'white' }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

