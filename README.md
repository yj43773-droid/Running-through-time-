# 마음구슬일기 (HeartOrbDiary)

AI 캐릭터와 함께하는 감정 기록 다이어리 웹앱

## 프로젝트 구조

```
src/
├── components/        # 재사용 가능한 UI 컴포넌트
│   ├── CapsuleMachine/
│   ├── MemoryOrb/
│   ├── Character/
│   ├── DiaryPaper/
│   ├── ReplyInput/
│   └── NavButtons/
├── pages/            # 페이지 컴포넌트
│   ├── Login/
│   ├── Home/
│   ├── DiaryWrite/
│   ├── DiaryComplete/
│   ├── Reinterpret/
│   ├── Calendar/
│   ├── CalendarDetail/
│   ├── MyPage/
│   └── Settings/
├── hooks/            # 커스텀 훅
│   ├── useAuth.ts
│   ├── useDiary.ts
│   ├── useMemoryOrbs.ts
│   └── useCharacters.ts
├── types/            # TypeScript 타입 정의
│   └── index.ts
├── styles/           # 스타일 파일
│   └── index.css
└── assets/           # 이미지, 아이콘 등 정적 파일
```

## 주요 기능

### 1. 로그인 페이지
- 이메일/비밀번호 로그인
- OAuth 로그인 (구글, 카카오, 네이버)

### 2. 홈 페이지
- 캡슐 머신 UI로 메모리 구슬 표시
- 하단 네비게이션 (달력, 일기쓰기, 마이페이지)

### 3. 일기 작성 페이지
- 리치 텍스트 에디터
- 사진 업로드
- 폰트 변경
- STT 음성 입력
- 감정 선택
- 완료 버튼

### 4. 일기 완료 페이지
- 일기 종이 배경 표시
- AI 캐릭터 슬라이드 인 애니메이션
- 공감 메시지 표시

### 5. 과거 일기 재해석 페이지
- 유사한 과거 일기 로드
- 캐릭터 프롬프트 표시
- 사용자 답변 입력
- 구슬로 변환 애니메이션
- 홈으로 이동

### 6. 달력 페이지
- 책장 스타일 달력 UI
- 감정별 색상으로 메모리 구슬 표시
- 재해석된 구슬 반짝임 효과

### 7. 달력 일기 상세 페이지
- 일기 완료 페이지와 유사한 레이아웃
- 재해석 응답 스크롤 뷰

### 8. 마이페이지
- 사용자 프로필
- 감정별 메모리 구슬 통계
- 설정 버튼

### 9. 설정 페이지
- 계정 설정
- 알림 설정
- 앱 설정

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **TailwindCSS** - 유틸리티 CSS 프레임워크
- **Framer Motion** - 애니메이션 라이브러리
- **React Router** - 라우팅
- **Vite** - 빌드 도구

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 개발 상태

현재 스켈레톤 코드로 구성되어 있으며, 다음 기능들이 추후 구현 예정입니다:

- API 연동 (현재 플레이스홀더)
- STT 음성 입력
- 실제 이미지 에셋
- AI 캐릭터 상호작용 로직
- 푸시 알림
- OAuth 실제 구현

## 모바일 최적화

- 모바일 퍼스트 디자인
- WebView 배포 준비
- 터치 제스처 지원
- 반응형 레이아웃

