// User types
export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  createdAt: string;
}

// Emotion types for memory orbs
export type EmotionType = 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'anxious' 
  | 'calm' 
  | 'excited' 
  | 'grateful' 
  | 'lonely';

// Emotion color mapping
// 백엔드 app/services/emotions.py의 EMOTION_COLOR_MAP을 기반으로 매핑
export const EMOTION_COLORS: Record<EmotionType, string> = {
  happy: '#FFD166',      // joy/happiness/기쁨/행복
  sad: '#118AB2',        // sadness/슬픔
  angry: '#EF476F',      // anger/rage/분노/화남
  anxious: '#073B4C',    // anxiety/불안
  calm: '#9BC53D',       // calm/serenity/평온/차분
  excited: '#8338EC',    // surprise/놀람
  grateful: '#FF758F',   // love/사랑
  lonely: '#B19CD9',     // 백엔드에 없음, 기존 색상 유지
};

// Memory Orb types
export interface MemoryOrb {
  id: string;
  diaryId: string;
  date: string;
  emotion: EmotionType;
  isReinterpreted: boolean;
  glitterEffect?: boolean;
  reinterpretationNote?: string;
  reinterpretationReplies?: ReinterpretationReply[];
}

// Diary types
export interface Diary {
  id: string;
  userId: string;
  date: string;
  content: string;
  photos?: string[];
  font?: string;
  createdAt: string;
  updatedAt: string;
  emotion?: EmotionType;
  aiCharacter?: string;
  aiResponse?: string;
  isEvolved?: boolean;
  reinterpretation?: string | null;
  evolvedEmotion?: string | null;
  emotionColor?: string | null;
  evolvedEmotionColor?: string | null;
  linkedPastDiaryId?: string | null;
  aiPersonaResponses?: unknown;
  similarDiaries?: unknown;
}

// Character types
export interface Character {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  color: string;
}

// Reinterpretation types
export interface ReinterpretationReply {
  id: string;
  characterId: string;
  characterName: string;
  message: string;
  timestamp: string;
}

export interface ReinterpretationPrompt {
  characterId: string;
  characterName: string;
  prompt: string;
}

// Calendar entry types
export interface CalendarEntry {
  date: string;
  orbs: MemoryOrb[];
}
