import React, { useState, useCallback } from 'react';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { Chat, Message, User } from './types';
import { CURRENT_USER, INITIAL_CHATS } from './constants';
import { Menu, Search } from 'lucide-react';

export default function App() {
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedChat = chats.find(c => c.id === selectedChatId);

  const handleSendMessage = useCallback((chatId: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: CURRENT_USER.id,
      text,
      timestamp: new Date(),
      status: 'sent'
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          // Move to top
        };
      }
      return chat;
    }).sort((a, b) => {
        if (a.id === chatId) return -1;
        if (b.id === chatId) return 1;
        return 0;
    }));
  }, []);

  const handleReceiveMessage = useCallback((chatId: string, message: Message) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        // If message ID exists, replace it (for streaming updates), else append
        const exists = chat.messages.find(m => m.id === message.id);
        let newMessages;
        if (exists) {
            newMessages = chat.messages.map(m => m.id === message.id ? message : m);
        } else {
            newMessages = [...chat.messages, message];
        }
        return {
          ...chat,
          messages: newMessages
        };
      }
      return chat;
    }));
  }, []);

  const handleReaction = useCallback((chatId: string, messageId: string, emoji: string) => {
    setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
            return {
                ...chat,
                messages: chat.messages.map(msg => {
                    if (msg.id === messageId) {
                        const existingReactions = msg.reactions || [];
                        const existingReactionIndex = existingReactions.findIndex(r => r.emoji === emoji);
                        
                        let newReactions = [...existingReactions];

                        if (existingReactionIndex > -1) {
                            const reaction = { ...newReactions[existingReactionIndex] };
                            if (reaction.userReacted) {
                                // Remove my reaction
                                reaction.count -= 1;
                                reaction.userReacted = false;
                                if (reaction.count <= 0) {
                                    newReactions.splice(existingReactionIndex, 1);
                                } else {
                                    newReactions[existingReactionIndex] = reaction;
                                }
                            } else {
                                // Add my reaction
                                reaction.count += 1;
                                reaction.userReacted = true;
                                newReactions[existingReactionIndex] = reaction;
                            }
                        } else {
                            // New reaction
                            newReactions.push({ emoji, count: 1, userReacted: true });
                        }
                        return { ...msg, reactions: newReactions };
                    }
                    return msg;
                })
            };
        }
        return chat;
    }));
  }, []);

  const setTyping = useCallback((chatId: string, isTyping: boolean) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isTyping } : c));
  }, []);

  const filteredChats = chats.filter(chat => {
    const participant = chat.participants.find(p => p.id !== CURRENT_USER.id);
    return participant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-screen bg-vex-900 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar - Hidden on mobile if chat selected */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-vex-800 bg-vex-800 transition-all duration-300 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-4 flex items-center gap-4">
          <button className="p-2 hover:bg-vex-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-vex-900 text-sm text-white pl-10 pr-4 py-2 rounded-full border border-vex-700 focus:border-vex-500 focus:outline-none transition-colors placeholder-slate-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <ChatList 
          chats={filteredChats} 
          selectedChatId={selectedChatId} 
          onSelectChat={setSelectedChatId} 
          currentUser={CURRENT_USER}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative bg-vex-900 ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <ChatWindow 
            chat={selectedChat}
            currentUser={CURRENT_USER}
            onBack={() => setSelectedChatId(null)}
            onSendMessage={handleSendMessage}
            onReceiveMessage={handleReceiveMessage}
            onReact={handleReaction}
            setTyping={setTyping}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-24 h-24 bg-vex-800 rounded-full flex items-center justify-center mb-6 shadow-2xl">
              <span className="text-4xl">✨</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to VexChat</h1>
            <p className="text-slate-400 max-w-md">
              Select a chat to start messaging. <br/>
              Experience the power of Gemini AI directly in your conversations.
            </p>
            <div className="mt-8 flex gap-2">
                <span className="text-xs px-2 py-1 rounded bg-vex-800 text-vex-400 border border-vex-700">Gemini Inside</span>
                <span className="text-xs px-2 py-1 rounded bg-vex-800 text-vex-400 border border-vex-700">Real-time Translation</span>
                <span className="text-xs px-2 py-1 rounded bg-vex-800 text-vex-400 border border-vex-700">Smart Rewrite</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}