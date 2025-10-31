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

// 구슬의 크기 (md 사이즈 기준, w-12 h-12 = 48px)
// 컨테이너가 보통 약 200-300px 정도라고 가정하면, 구슬 크기는 약 2-3% 정도
// 안전 마진을 위해 구슬 반지름을 약 1.5%로 설정 (구슬 전체가 원 안에 들어가도록)
const ORB_RADIUS_PERCENT = 1.5; // 구슬의 반지름 (%)

// 점이 원 내부에 있는지 확인하고, 원 밖이면 원의 경계로 제한 (중앙 기준)
const constrainToCircle = (point: { x: number; y: number }) => {
  // 중앙을 정확히 가운데로 고정
  const centerX = TANK_CENTER_X; // 50 (가운데)
  const centerY = TANK_CENTER_Y; // 50
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

// 초기 위치 생성 (원형 범위 내 랜덤 생성)
const generateInitialPositions = (count: number) => {
  const positions: Array<{ x: number; y: number }> = [];
  const displayCount = Math.min(count, 10);
  const centerX = TANK_CENTER_X; // 50 (가운데)
  const centerY = TANK_CENTER_Y; // 50 (가운데)

  for (let i = 0; i < displayCount; i++) {
    // 원 내부에 랜덤하게 위치 생성 (구슬 전체가 빨간 원형 경계선 안에만 존재)
    // X 좌표를 먼저 균등하게 분산 (좌우 대칭)
    // -1 ~ 1 범위로 균등하게 분산 (중앙 기준 대칭)
    const normalizedX = (Math.random() - 0.5) * 2; // -1 ~ 1 범위
    const xOffset = normalizedX * 0.9; // -0.9 ~ 0.9 (약간의 여유를 둠)
    
    // 반지름: 하단 부분에 많이 배치 (70% ~ 95% 범위)
    const radiusRatio = Math.sqrt(Math.random()); // 0 ~ 1 (제곱근 분포)
    const adjustedRadiusRatio = 0.7 + radiusRatio * 0.25; // 0.7 ~ 0.95 (원 경계 근처에 배치)
    
    // 구슬 전체가 원 안에 들어가도록 안전 거리 계산
    const maxSafeDistance = TANK_RADIUS - ORB_RADIUS_PERCENT; // 구슬이 원 밖으로 나가지 않는 최대 거리
    const maxDistance = maxSafeDistance * adjustedRadiusRatio; // 최대 거리
    
    // X 좌표에서 원의 하단 경계까지의 Y 거리 계산 (피타고라스)
    const absXOffset = Math.abs(xOffset);
    const maxYDistance = Math.sqrt(1 - absXOffset * absXOffset); // 0 ~ 1 범위
    
    // 하단 부분에 배치 (Y를 아래쪽으로)
    const yDistance = maxYDistance * maxDistance; // 하단 경계까지의 거리
    const yOffset = yDistance * 0.9; // 하단 경계 근처에 배치 (90% 위치)
    
    // 원 내부 위치 계산 (X는 균등 분산, Y는 하단 부분)
    const x = centerX + xOffset * maxDistance;
    const y = centerY + yOffset; // 아래쪽 방향
    
    // 구슬 전체가 원 안에 있는지 최종 확인 및 강제 제한
    const dx = x - centerX;
    const dy = y - centerY;
    const calculatedDistance = Math.sqrt(dx * dx + dy * dy);
    
    // 구슬의 중심점이 원 경계에서 구슬 반지름만큼 안쪽에 있는지 확인
    const maxAllowedDistance = TANK_RADIUS - ORB_RADIUS_PERCENT;
    let constrained = { x, y };
    if (calculatedDistance > maxAllowedDistance) {
      // 구슬 전체가 원 안에 들어가도록 안전 거리로 강제 이동
      const safeDistance = maxAllowedDistance * 0.95; // 여유를 두고 95% 위치로
      const angle2 = Math.atan2(dy, dx);
      constrained = {
        x: centerX + Math.cos(angle2) * safeDistance,
        y: centerY + Math.sin(angle2) * safeDistance,
      };
    }
    
    // 최종 검증: 거리 계산
    const finalDx = constrained.x - centerX;
    const finalDy = constrained.y - centerY;
    const finalDistance = Math.sqrt(finalDx * finalDx + finalDy * finalDy);
    
    // 디버깅: 첫 번째와 마지막 구슬 위치 확인
    if (i === 0 || i === displayCount - 1) {
      console.log(`구슬 ${i}: x=${constrained.x.toFixed(2)}, y=${constrained.y.toFixed(2)}, 거리=${finalDistance.toFixed(2)}/${TANK_RADIUS}`);
    }
    
    // 원 밖에 있으면 오류 (이것은 발생하지 않아야 함)
    if (finalDistance > TANK_RADIUS + 0.1) {
      console.error(`구슬 ${i}가 원 밖에 있습니다! 거리: ${finalDistance.toFixed(2)}, 반지름: ${TANK_RADIUS}`);
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

