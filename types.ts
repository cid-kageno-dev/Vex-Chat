export interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  isAi?: boolean; // Flag for Gemini Bot
}

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  isAiGenerated?: boolean;
  reactions?: Reaction[];
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  draft?: string;
  isTyping?: boolean;
}

export enum AiActionType {
  REWRITE_PROFESSIONAL = 'REWRITE_PROFESSIONAL',
  REWRITE_FRIENDLY = 'REWRITE_FRIENDLY',
  FIX_GRAMMAR = 'FIX_GRAMMAR',
  TRANSLATE_EN = 'TRANSLATE_EN',
  SUMMARIZE = 'SUMMARIZE',
  EXPLAIN = 'EXPLAIN'
}