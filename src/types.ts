export interface User {
  id: string;
  email: string;
  displayName?: string;
  passwordHash: string;
  createdAt: string;
}

export interface Diary {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  emotion: string;
  aiCharacter: string;
  aiResponse: string;
  isEvolved: boolean;
  reinterpretation?: string;
  evolvedEmotion?: string;
  aiPersonaResponses?: any[];
  similarDiaryRefs?: any[];
  emotionColor?: string;
  evolvedEmotionColor?: string;
  linkedPastDiaryId?: string;
}

export interface MemoryOrb {
  id: string;
  userId: string;
  diaryId: string;
  emotion: string;
  date: string;
  isReinterpreted: boolean;
  reinterpretationNote?: string;
  reinterpretationReplies?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
