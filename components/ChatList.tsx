import React from 'react';
import { Chat, User } from '../types';
import { Avatar } from './Avatar';
import { format } from 'date-fns';
import { Sparkles } from 'lucide-react';

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUser: User;
}

export const ChatList: React.FC<ChatListProps> = ({ chats, selectedChatId, onSelectChat, currentUser }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => {
        const otherParticipant = chat.participants.find(p => p.id !== currentUser.id) || chat.participants[0];
        const lastMessage = chat.messages[chat.messages.length - 1];
        const isSelected = chat.id === selectedChatId;
        
        return (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${
              isSelected ? 'bg-vex-500/20 border-l-4 border-vex-500' : 'hover:bg-vex-700/50 border-l-4 border-transparent'
            }`}
          >
            <div className="flex-shrink-0 mr-3">
              <Avatar 
                src={otherParticipant.avatar} 
                alt={otherParticipant.name} 
                isOnline={otherParticipant.isOnline} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <div className="flex items-center gap-1">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {otherParticipant.name}
                    </h3>
                    {otherParticipant.isAi && <Sparkles size={12} className="text-vex-accent" fill="currentColor" />}
                </div>
                <span className="text-xs text-slate-500">
                  {lastMessage && format(lastMessage.timestamp, 'HH:mm')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-sm truncate pr-2 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {chat.isTyping ? <span className="text-vex-400 animate-pulse">Typing...</span> : (lastMessage?.text || 'No messages')}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-vex-500 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
