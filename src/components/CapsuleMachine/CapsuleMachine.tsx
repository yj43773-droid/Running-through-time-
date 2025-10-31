import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MemoryOrb } from '@/types';
import { MemoryOrb as MemoryOrbComponent } from '@/components/MemoryOrb';

interface CapsuleMachineProps {
  orbs: MemoryOrb[];
  onOrbClick?: (orb: MemoryOrb) => void;
  machineImage?: string; // 캡슐 머신 이미지 경로
  maxOrbsInTank?: number; // 통 안에 표시할 최대 구슬 개수
}

// 통 안에 구슬을 자연스럽게 배치하기 위한 위치 생성
const generateOrbPositions = (count: number, maxCount: number = 10) => {
  const positions: Array<{ top: string; left: string; rotation: number }> = [];
  const displayCount = Math.min(count, maxCount);

  // 구슬들을 통 안에 자연스럽게 배치 (2-3층 구조)
  for (let i = 0; i < displayCount; i++) {
    const layer = Math.floor(i / 4); // 4개씩 층을 나눔
    const positionInLayer = i % 4;
    
    // 각 구슬의 위치를 약간씩 랜덤하게 배치
    const baseLeft = 20 + positionInLayer * 20; // 20%, 40%, 60%, 80%
    const baseTop = 65 + layer * 8; // 65%, 73%, 81% (통의 하단 부분)
    
    // 약간의 랜덤 오프셋 추가
    const leftOffset = (Math.random() - 0.5) * 10;
    const topOffset = (Math.random() - 0.5) * 5;
    const rotation = (Math.random() - 0.5) * 30; // -15도 ~ +15도 회전

    positions.push({
      left: `${Math.max(10, Math.min(85, baseLeft + leftOffset))}%`,
      top: `${Math.max(60, Math.min(85, baseTop + topOffset))}%`,
      rotation,
    });
  }

  return positions;
};

export const CapsuleMachine: React.FC<CapsuleMachineProps> = ({ 
  orbs, 
  onOrbClick,
  machineImage,
  maxOrbsInTank = 10
}) => {
  // 통 안에 표시할 구슬들 (최대 10개)
  const orbsInTank = useMemo(() => {
    return orbs.slice(0, maxOrbsInTank);
  }, [orbs, maxOrbsInTank]);

  // 구슬 위치 생성
  const orbPositions = useMemo(() => {
    return generateOrbPositions(orbsInTank.length, maxOrbsInTank);
  }, [orbsInTank.length, maxOrbsInTank]);

  // 통 밖에 표시할 구슬들 (나머지)
  const remainingOrbs = orbs.slice(maxOrbsInTank);

  return (
    <div className="relative w-full h-80 flex items-center justify-center bg-gradient-to-b from-purple-100 to-pink-100 rounded-3xl overflow-hidden">
      {/* 캡슐 머신 이미지 배경 */}
      {machineImage ? (
        <motion.img
          src={machineImage}
          alt="캡슐 뽑기 기계"
          className="absolute inset-0 w-full h-full object-contain object-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      ) : (
        // 이미지가 없을 때 기본 디자인
        <>
          {/* Machine frame */}
          <div className="absolute inset-0 border-8 border-gray-800 rounded-3xl"></div>
          
          {/* Machine details */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-gray-700 rounded-full"></div>
          
          {/* 통 (Tank) - 하단 부분 */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1/3 bg-gray-600 rounded-t-2xl border-4 border-gray-700 border-b-0"></div>
        </>
      )}

      {/* 통 안의 구슬들 (Tank Area) */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1/3 pointer-events-none">
        {orbsInTank.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 text-xs text-center"
          >
            아직 구슬이 없습니다
          </motion.div>
        ) : (
          orbsInTank.map((orb, index) => {
            const position = orbPositions[index];
            return (
              <motion.div
                key={orb.id}
                className="absolute pointer-events-auto"
                style={{
                  left: position.left,
                  top: position.top,
                  transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
                }}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15
                }}
                whileHover={{ scale: 1.2, zIndex: 50 }}
                onClick={() => onOrbClick?.(orb)}
              >
                <MemoryOrbComponent
                  orb={orb}
                  size="sm"
                  onClick={() => onOrbClick?.(orb)}
                  showGlitter={orb.isReinterpreted}
                />
              </motion.div>
            );
          })
        )}
      </div>

      {/* 통 밖의 구슬 표시 영역 (기존 영역 - 선택적) */}
      {remainingOrbs.length > 0 && (
        <div className="absolute top-4 right-4 z-20">
          <div className="relative">
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold shadow-lg"
              whileHover={{ scale: 1.1 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              +{remainingOrbs.length}
            </motion.div>
          </div>
        </div>
      )}

      {/* 통이 비어있을 때 메시지 */}
      {orbs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 text-sm text-center z-10"
        >
          일기를 작성하면<br />
          구슬이 생성됩니다 ✨
        </motion.div>
      )}
    </div>
  );
};
