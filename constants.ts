import { Chat, User } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  name: 'You',
  avatar: 'https://picsum.photos/id/64/200/200',
  isOnline: true,
};

export const GEMINI_USER: User = {
  id: 'gemini',
  name: 'Gemini',
  avatar: 'https://picsum.photos/id/532/200/200', // Abstract/Techy look usually, using placeholder
  isOnline: true,
  isAi: true,
};

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'c1',
    participants: [GEMINI_USER],
    messages: [
      {
        id: 'm1',
        senderId: 'gemini',
        text: 'Hello! I am Gemini. I can help you write better messages, answer questions, or just chat. How can I help you today?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        status: 'read',
      }
    ],
    unreadCount: 0,
  },
  {
    id: 'c2',
    participants: [{ id: 'u2', name: 'Alice Williams', avatar: 'https://picsum.photos/id/65/200/200', isOnline: true }],
    messages: [
      {
        id: 'm2-1',
        senderId: 'u2',
        text: 'Hey, are we still on for the meeting tomorrow?',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        status: 'read',
      },
      {
        id: 'm2-2',
        senderId: 'me',
        text: 'Yes, absolutely.',
        timestamp: new Date(Date.now() - 1000 * 60 * 115),
        status: 'read',
      },
       {
        id: 'm2-3',
        senderId: 'u2',
        text: 'Great. Can you bring the project files?',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        status: 'read',
      }
    ],
    unreadCount: 1,
  },
  {
    id: 'c3',
    participants: [{ id: 'u3', name: 'Bob Smith', avatar: 'https://picsum.photos/id/91/200/200', isOnline: false }],
    messages: [
      {
        id: 'm3-1',
        senderId: 'u3',
        text: 'Did you see the game last night?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: 'read',
      }
    ],
    unreadCount: 0,
  },
  {
    id: 'c4',
    participants: [{ id: 'u4', name: 'Team Alpha', avatar: 'https://picsum.photos/id/180/200/200', isOnline: false }],
    messages: [
      {
        id: 'm4-1',
        senderId: 'u4',
        text: 'Please review the attached documents by EOD.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
        status: 'read',
      }
    ],
    unreadCount: 0,
  }
];
