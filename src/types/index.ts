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
export const EMOTION_COLORS: Record<EmotionType, string> = {
  happy: '#FFD93D',
  sad: '#6BCAE2',
  angry: '#FF6B6B',
  anxious: '#A8DADC',
  calm: '#95E1D3',
  excited: '#FF9F66',
  grateful: '#FFD3A5',
  lonely: '#B19CD9',
};

// Memory Orb types
export interface MemoryOrb {
  id: string;
  diaryId: string;
  date: string;
  emotion: EmotionType;
  isReinterpreted: boolean;
  glitterEffect?: boolean;
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

