import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { MemoryOrb } from '@/types';
import { MemoryOrb as MemoryOrbComponent } from '@/components/MemoryOrb';

interface CapsuleMachineProps {
  orbs: MemoryOrb[];
  onOrbClick?: (orb: MemoryOrb) => void;
  machineImage?: string; // 캡슐 머신 이미지 경로
  maxOrbsInTank?: number; // 통 안에 표시할 최대 구슬 개수
}

// 통의 범위 정의 (원형) - 보이는 영역과 일치시킴
// 보이는 영역: circle(50% at 50% 50%) = 반지름 50%, 중심 (50%, 50%)
const TANK_CENTER_X = 50; // 통의 중심 X 좌표 (%) - 컨테이너 기준 (정확히 중앙)
const TANK_CENTER_Y = 50; // 통의 중심 Y 좌표 (%) - 컨테이너 기준 (정확히 중앙)
const TANK_RADIUS = 45; // 통의 반지름 (%) - 컨테이너 기준, 살짝 줄임

// 점이 원 내부에 있는지 확인하고, 원 밖이면 원의 경계로 제한 (중앙 기준)
const constrainToCircle = (point: { x: number; y: number }) => {
  // 중앙을 정확히 50%로 고정
  const centerX = 50; // 항상 중앙
  const centerY = 50; // 항상 중앙
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance <= TANK_RADIUS) {
    return point; // 원 내부에 있으면 그대로 반환
  }
  
  // 원 밖에 있으면 원의 경계로 제한 (중앙 기준)
  const angle = Math.atan2(dy, dx);
  return {
    x: centerX + Math.cos(angle) * TANK_RADIUS,
    y: centerY + Math.sin(angle) * TANK_RADIUS,
  };
};

// 초기 위치 생성 (구슬 간격을 넓게, 원형 범위 내, 하단에 많이 배치)
const generateInitialPositions = (count: number) => {
  const positions: Array<{ x: number; y: number }> = [];
  const displayCount = Math.min(count, 10);

  for (let i = 0; i < displayCount; i++) {
    // Y축은 아래쪽에 많이 배치
    const yBias = Math.pow(i / displayCount, 0.5); // 제곱근 분포로 아래쪽에 더 많이
    
    // X축은 원형 범위 내에서 균등하게 분산 (정확히 중앙 50% 기준으로 좌우 대칭)
    const centerX = 50; // 컨테이너 기준 정확히 중앙
    const maxXOffset = TANK_RADIUS * 0.85; // 반지름의 85% 범위 사용
    
    // i를 -1 ~ 1 범위로 균등하게 매핑 (좌우 대칭)
    let normalizedPos: number;
    if (displayCount === 1) {
      normalizedPos = 0; // 중앙
    } else {
      normalizedPos = (i / (displayCount - 1)) * 2 - 1; // -1 ~ 1
    }
    
    const xOffset = normalizedPos * maxXOffset; // 중앙 기준 대칭 오프셋
    const xPercent = centerX + xOffset; // 중앙(50%) 기준으로 대칭 분산
    
    // X 위치가 원의 범위 내에 있는지 확인하고 제한
    const minX = centerX - TANK_RADIUS;
    const maxX = centerX + TANK_RADIUS;
    const constrainedX = Math.max(minX, Math.min(maxX, xPercent));
    
    // 이 X 위치에서 원의 경계까지의 거리를 계산 (원 내부인지 확인)
    const dx = (constrainedX - centerX) / TANK_RADIUS; // -1 ~ 1 범위
    const absDx = Math.abs(dx);
    
    // X 위치가 원의 범위를 넘지 않도록 확인
    if (absDx > 1) {
      // X가 원 밖에 있으면 원의 경계로 제한
      const sign = dx >= 0 ? 1 : -1;
      const finalX = centerX + sign * TANK_RADIUS;
      
      // 원의 하단에 Y 위치 설정
      const maxDy = 0; // 원의 좌우 끝에서는 Y 거리가 0
      const bottomBoundaryY = TANK_CENTER_Y + maxDy * TANK_RADIUS;
      const distanceFromBoundary = (0.7 + yBias * 0.25) * TANK_RADIUS * 0.3;
      const finalY = bottomBoundaryY - distanceFromBoundary;
      
      positions.push({ x: finalX, y: finalY });
      continue;
    }
    
    // 이 X 위치에서 원의 경계까지의 Y 거리 (피타고라스: r² = dx² + dy²)
    const maxDy = Math.sqrt(1 - dx * dx); // 0 ~ 1 범위
    
    // 원의 하단 경계 Y = TANK_CENTER_Y + maxDy * TANK_RADIUS
    // 원 내부 하단 부분에 배치: 경계에서 위로 올라가는 정도를 yBias로 조절
    const bottomBoundaryY = TANK_CENTER_Y + maxDy * TANK_RADIUS;
    const distanceFromBoundary = (0.7 + yBias * 0.25) * TANK_RADIUS * 0.3; // 경계에서 위로 최대 30% 반지름만큼
    const finalY = bottomBoundaryY - distanceFromBoundary;
    
    // 최종 위치를 원 내부로 제한 (중앙 정렬 유지)
    const constrained = constrainToCircle({ x: constrainedX, y: finalY });
    
    // 디버깅: 첫 번째와 마지막 구슬 위치 확인
    if (i === 0 || i === displayCount - 1) {
      console.log(`구슬 ${i}: x=${constrained.x.toFixed(2)}, y=${constrained.y.toFixed(2)}, dx=${dx.toFixed(2)}, maxDy=${maxDy.toFixed(2)}`);
    }
    
    positions.push(constrained);
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

  // 초기 위치 생성
  const initialPositions = useMemo(() => {
    return generateInitialPositions(orbsInTank.length);
  }, [orbsInTank.length]);

  // 통 밖에 표시할 구슬들 (나머지)
  const remainingOrbs = orbs.slice(maxOrbsInTank);

  // 통 컨테이너 ref
  const tankRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-purple-100 to-pink-100" 
         style={{ height: '60vh', minHeight: '300px', maxHeight: '500px' }}>
      {/* 캡슐 머신 이미지 배경 */}
      {machineImage ? (
        <motion.img
          src={machineImage}
          alt="캡슐 뽑기 기계"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ zIndex: 1, width: '100%', height: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          onError={(e) => {
            console.error('이미지 로드 실패:', machineImage);
            console.error('이미지 요소:', e.currentTarget);
          }}
          onLoad={() => {
            console.log('이미지 로드 성공:', machineImage);
          }}
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

      {/* 통 안의 구슬들 (Tank Area) - 중앙의 투명한 구형 통 부분 */}
      <div 
        ref={tankRef}
        className="absolute top-[28%] left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-1/2 h-[37%] pointer-events-none z-10 overflow-visible"
      >
        {/* 구슬 존재 가능 영역 표시 (디버깅용 원형 경계선) */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${TANK_CENTER_X}%`,
            top: `${TANK_CENTER_Y}%`,
            width: `${TANK_RADIUS * 2}%`,
            height: `${TANK_RADIUS * 2}%`,
            transform: 'translate(-50%, -50%)',
            border: '2px solid red',
            borderRadius: '50%',
            boxSizing: 'border-box',
          }}
        />
        {orbsInTank.length > 0 && orbsInTank.map((orb, index) => {
          const position = initialPositions[index] || { x: 50, y: 50 };
          
          return (
            <motion.div
              key={orb.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: index * 0.05,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              whileHover={{ scale: 1.1, zIndex: 50 }}
            >
              <MemoryOrbComponent
                orb={orb}
                size="md"
                onClick={() => {}}
                showGlitter={orb.isReinterpreted}
              />
            </motion.div>
          );
        })}
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
    </div>
  );
};

