import React from 'react';
import { motion } from 'framer-motion';
import { MemoryOrb } from '@/types';
import { EMOTION_COLORS } from '@/types';

interface CapsuleMachineProps {
  orbs: MemoryOrb[];
  onOrbClick?: (orb: MemoryOrb) => void;
}

export const CapsuleMachine: React.FC<CapsuleMachineProps> = ({ orbs, onOrbClick }) => {
  return (
    <div className="relative w-full h-64 flex items-center justify-center bg-gradient-to-b from-purple-100 to-pink-100 rounded-3xl overflow-hidden">
      {/* Machine frame */}
      <div className="absolute inset-0 border-8 border-gray-800 rounded-3xl"></div>
      
      {/* Machine details */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-gray-700 rounded-full"></div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-16 bg-gray-600 rounded-t-full"></div>
      
      {/* Memory orbs display area */}
      <div className="relative z-10 flex flex-wrap gap-3 justify-center items-center p-4 w-full max-w-xs">
        {orbs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-500 text-sm text-center"
          >
            아직 기억 구슬이 없습니다.<br />
            일기를 작성하면 구슬이 생성됩니다.
          </motion.div>
        ) : (
          orbs.slice(0, 6).map((orb, index) => (
            <motion.div
              key={orb.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onOrbClick?.(orb)}
              className="relative w-12 h-12 rounded-full cursor-pointer shadow-lg"
              style={{ backgroundColor: EMOTION_COLORS[orb.emotion] }}
            >
              {orb.isReinterpreted && (
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                  }}
                  className="absolute inset-0 rounded-full border-2 border-white"
                />
              )}
            </motion.div>
          ))
        )}
        
        {orbs.length > 6 && (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">
            +{orbs.length - 6}
          </div>
        )}
      </div>
    </div>
  );
};

