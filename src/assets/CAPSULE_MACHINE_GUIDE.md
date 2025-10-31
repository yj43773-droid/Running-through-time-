# 캡슐 머신 이미지 가이드

## 이미지가 필요한 이유

캡슐 머신은 **항상 표시**되어야 하며, 실제 캡슐 뽑기 기계처럼 보이려면 **일러스트 이미지**가 필요합니다.

## 이미지 요구사항

### 추천 사양
- **형식**: PNG (투명 배경 권장) 또는 SVG
- **크기**: 최소 800x600px 이상 (고해상도 대응)
- **배경**: 투명 배경 (구슬이 보이도록)
- **스타일**: 캡슐 뽑기 기계 일러스트

### 이미지 구성
1. **머신 프레임**: 기계의 외곽 프레임
2. **투명 통 영역**: 하단에 구슬이 보이는 통 부분 (투명 또는 반투명)
3. **뽑기 구멍**: 구슬이 나오는 구멍 (상단)

## 통 영역 안내

이미지의 **하단 1/3 부분**에 통(투명 또는 반투명)을 배치해주세요.
- 구슬들은 이 영역에 표시됩니다
- 통 영역은 투명하게 처리하면 자연스럽습니다

## 사용 방법

1. 이미지를 `src/assets/` 폴더에 저장
   - 예: `capsule-machine.png`
   - 예: `capsule-machine.svg`

2. `src/pages/Home/Home.tsx`에서 import:
   ```typescript
   import capsuleMachineImage from '@/assets/capsule-machine.png';
   ```

3. CapsuleMachine 컴포넌트에 전달:
   ```typescript
   <CapsuleMachine 
     orbs={orbs} 
     onOrbClick={handleOrbClick}
     machineImage={capsuleMachineImage}
   />
   ```

## 현재 상태

- ✅ 캡슐 머신은 항상 표시됨
- ✅ 일기 개수와 상관없이 머신 표시
- ✅ 통 안에 구슬 표시 준비 완료
- ⏳ **일러스트 이미지 추가 필요**

## 디자인 팁

통 부분을 투명하게 하면:
- 구슬들이 자연스럽게 보임
- 일기 개수에 따라 구슬이 채워지는 모습을 볼 수 있음

