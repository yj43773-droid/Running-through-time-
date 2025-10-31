# Assets 폴더

이 폴더에 이미지 및 기타 정적 파일을 저장합니다.

## 사용 방법

### 이미지 추가하기

1. 이미지 파일을 이 폴더(`src/assets/`)에 복사합니다.
   - 예: `capsule-machine.png`, `capsule-machine.jpg`, `capsule-machine.svg` 등

2. 컴포넌트에서 import합니다:
   ```typescript
   import capsuleMachineImage from '@/assets/capsule-machine.png';
   ```

3. 컴포넌트에서 사용합니다:
   ```typescript
   <img src={capsuleMachineImage} alt="캡슐 머신" />
   ```

### 지원되는 이미지 형식

- `.png`
- `.jpg` / `.jpeg`
- `.svg`
- `.gif`
- `.webp`

### 캡슐 머신 이미지 사용 예시

`src/pages/Home/Home.tsx`에서:
```typescript
import capsuleMachineImage from '@/assets/capsule-machine.png';

// ... 컴포넌트 내부
<CapsuleMachine 
  orbs={orbs} 
  onOrbClick={handleOrbClick}
  machineImage={capsuleMachineImage}
/>
```

