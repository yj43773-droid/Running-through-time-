import React from 'react';
import { motion } from 'framer-motion';
import { MemoryOrb as MemoryOrbType, EMOTION_COLORS } from '@/types';

interface MemoryOrbProps {
  orb: MemoryOrbType;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showGlitter?: boolean;
}

export const MemoryOrb: React.FC<MemoryOrbProps> = ({
  orb,
  size = 'md',
  onClick,
  showGlitter = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const orbColor = EMOTION_COLORS[orb.emotion];

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} rounded-full cursor-pointer shadow-lg`}
      style={{ backgroundColor: orbColor }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {/* Glitter effect for reinterpreted orbs */}
      {showGlitter && orb.isReinterpreted && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              `0 0 0 0 rgba(255, 255, 255, 0.7)`,
              `0 0 20px 10px rgba(255, 255, 255, 0.3)`,
              `0 0 0 0 rgba(255, 255, 255, 0.7)`,
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
        >
          {/* Glitter particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${20 + i * 15}%`,
                left: `${20 + (i % 3) * 30}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Inner highlight */}
      <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-white rounded-full opacity-30"></div>
    </motion.div>
  );
};

