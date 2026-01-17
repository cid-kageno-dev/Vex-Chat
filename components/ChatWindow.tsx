import React, { useState, useEffect, useRef } from 'react';
import { Chat, User, Message, AiActionType } from '../types';
import { MessageBubble } from './MessageBubble';
import { Avatar } from './Avatar';
import { Send, Paperclip, Mic, Smile, ArrowLeft, Sparkles, X, Wand2, Search, MoreHorizontal, FileText, Zap, Languages } from 'lucide-react';
import { sendGeminiMessage, performAiAction, summarizeConversation, generateSmartReplies } from '../services/geminiService';
import { GEMINI_USER } from '../constants';

interface ChatWindowProps {
  chat: Chat;
  currentUser: User;
  onBack: () => void;
  onSendMessage: (chatId: string, text: string) => void;
  onReceiveMessage: (chatId: string, message: Message) => void;
  onReact: (chatId: string, messageId: string, emoji: string) => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chat, 
  currentUser, 
  onBack, 
  onSendMessage, 
  onReceiveMessage,
  onReact,
  setTyping
}) => {
  const [inputText, setInputText] = useState(chat.draft || '');
  const [showAiTools, setShowAiTools] = useState(false);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const otherParticipant = chat.participants.find(p => p.id !== currentUser.id) || chat.participants[0];
  const isGemini = otherParticipant.id === GEMINI_USER.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, quickReplies]);

  // Generate Smart Replies
  useEffect(() => {
    const lastMessage = chat.messages[chat.messages.length - 1];
    
    // Clear replies if I was the last one to speak
    if (lastMessage?.senderId === currentUser.id) {
        setQuickReplies([]);
        return;
    }

    // Generate replies if last message is from partner and partner is NOT an AI
    if (lastMessage && lastMessage.senderId !== currentUser.id && !otherParticipant.isAi) {
        // Debounce or just call it. For this demo, calling directly is fine.
        generateSmartReplies(chat.messages, chat.participants, currentUser.id)
            .then(replies => setQuickReplies(replies))
            .catch(() => setQuickReplies([]));
    }
  }, [chat.messages, currentUser.id, otherParticipant.isAi]);


  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const textToSend = inputText;
    setInputText('');
    setQuickReplies([]); // Clear suggestions on send
    onSendMessage(chat.id, textToSend);

    // Gemini Integration for Bot Chat
    if (isGemini) {
      setTyping(chat.id, true);
      try {
        // Construct history for API
        const history = chat.messages.map(m => ({
          role: m.senderId === currentUser.id ? 'user' as const : 'model' as const,
          parts: [{ text: m.text }]
        }));
        
        const stream = await sendGeminiMessage(history, textToSend);
        
        let fullResponse = "";
        let messageId = `gemini-response-${Date.now()}`;
        let isFirstChunk = true;

        for await (const chunk of stream) {
            fullResponse += chunk;
            
            // On first chunk, create the message
            if (isFirstChunk) {
                onReceiveMessage(chat.id, {
                    id: messageId,
                    senderId: GEMINI_USER.id,
                    text: fullResponse,
                    timestamp: new Date(),
                    status: 'read',
                    isAiGenerated: true
                });
                isFirstChunk = false;
            } else {
                // Update existing message (mocking update by sending same ID but logic handled in App to replace)
                 onReceiveMessage(chat.id, {
                    id: messageId,
                    senderId: GEMINI_USER.id,
                    text: fullResponse,
                    timestamp: new Date(),
                    status: 'read',
                    isAiGenerated: true
                });
            }
            scrollToBottom();
        }

      } catch (error) {
        console.error("Failed to chat with Gemini", error);
      } finally {
        setTyping(chat.id, false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAiTool = async (action: AiActionType) => {
    if (!inputText.trim()) return;
    setIsAiRefining(true);
    const refined = await performAiAction(inputText, action);
    setInputText(refined);
    setIsAiRefining(false);
    setShowAiTools(false);
  };

  const handleSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    try {
        const summary = await summarizeConversation(chat.messages, chat.participants);
        const summaryMessage: Message = {
            id: `summary-${Date.now()}`,
            senderId: GEMINI_USER.id,
            text: `📝 **Conversation Summary**\n\n${summary}`,
            timestamp: new Date(),
            status: 'read',
            isAiGenerated: true
        };
        onReceiveMessage(chat.id, summaryMessage);
    } catch (error) {
        console.error("Failed to summarize", error);
    } finally {
        setIsSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b1221] relative"> {/* slightly darker than main bg for contrast if needed */}
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-vex-800 border-b border-vex-700 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-slate-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <Avatar src={otherParticipant.avatar} alt={otherParticipant.name} isOnline={otherParticipant.isOnline} />
          <div>
            <div className="flex items-center gap-1">
                <h2 className="font-semibold text-white">{otherParticipant.name}</h2>
                {isGemini && <Sparkles size={14} className="text-vex-accent" fill="currentColor"/>}
            </div>
            
            <p className="text-xs text-vex-400">
              {chat.isTyping ? 'typing...' : (otherParticipant.isOnline ? 'online' : 'last seen recently')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
           <button 
              onClick={handleSummarize}
              disabled={isSummarizing}
              className={`cursor-pointer hover:text-white transition-colors ${isSummarizing ? 'text-vex-accent animate-pulse' : ''}`}
              title="Summarize Chat"
           >
              <FileText size={20} />
           </button>
           <Search size={20} className="cursor-pointer hover:text-white" />
           <MoreHorizontal size={20} className="cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[url('https://transparenttextures.com/patterns/dark-matter.png')]">
        {chat.messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isMe={msg.senderId === currentUser.id} 
            sender={msg.senderId === currentUser.id ? currentUser : otherParticipant}
            onReact={(emoji) => onReact(chat.id, msg.id, emoji)} 
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-vex-800 border-t border-vex-700 relative flex flex-col gap-2">
        
        {/* Quick Replies - Contextually rendered */}
        {quickReplies.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar animate-fade-in">
                <div className="flex items-center text-xs text-vex-accent/80 mr-1 select-none">
                    <Zap size={12} className="mr-1"/> Quick Replies:
                </div>
                {quickReplies.map((reply, idx) => (
                    <button
                        key={idx}
                        onClick={() => setInputText(reply)}
                        className="whitespace-nowrap px-3 py-1.5 rounded-full bg-vex-700/50 border border-vex-600 text-xs text-slate-200 hover:bg-vex-600 hover:border-vex-500 hover:text-white transition-all transform hover:scale-105"
                    >
                        {reply}
                    </button>
                ))}
            </div>
        )}

        {/* AI Tools Popover */}
        {showAiTools && (
          <div className="absolute bottom-full left-4 mb-2 bg-slate-800 border border-vex-600 rounded-xl shadow-2xl w-64 overflow-hidden z-20 animate-fade-in-up">
            <div className="p-2 bg-vex-900 border-b border-vex-700 flex justify-between items-center">
                <span className="text-xs font-bold text-vex-accent flex items-center gap-1"><Sparkles size={12}/> Gemini Magic</span>
                <button onClick={() => setShowAiTools(false)}><X size={14} className="text-slate-500 hover:text-white"/></button>
            </div>
            <div className="p-1">
                <button disabled={isAiRefining} onClick={() => handleAiTool(AiActionType.REWRITE_PROFESSIONAL)} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-vex-700 rounded transition-colors flex items-center gap-2">
                    Briefcase Professional
                </button>
                <button disabled={isAiRefining} onClick={() => handleAiTool(AiActionType.REWRITE_FRIENDLY)} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-vex-700 rounded transition-colors flex items-center gap-2">
                    Coffee Friendly
                </button>
                <button disabled={isAiRefining} onClick={() => handleAiTool(AiActionType.FIX_GRAMMAR)} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-vex-700 rounded transition-colors flex items-center gap-2">
                    Check Grammar
                </button>
            </div>
            {isAiRefining && <div className="h-1 bg-vex-500 animate-pulse"></div>}
          </div>
        )}

        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full">
          <button className="p-2 text-slate-400 hover:text-white transition-colors mb-1">
            <Paperclip size={22} />
          </button>
          
          <div className="flex-1 bg-vex-900 rounded-2xl flex flex-col border border-vex-600 focus-within:border-vex-500 transition-colors">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message..."
              className="w-full bg-transparent text-white px-4 py-3 max-h-32 min-h-[48px] resize-none focus:outline-none custom-scrollbar"
              rows={1}
            />
            {inputText.length > 0 && (
                <div className="px-2 pb-1 flex items-center gap-2">
                    <button 
                        onClick={() => setShowAiTools(!showAiTools)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${showAiTools ? 'bg-vex-accent text-white' : 'text-vex-accent hover:bg-vex-accent/10'}`}
                    >
                        <Wand2 size={12} /> AI Rewrite
                    </button>
                    <button 
                        onClick={() => handleAiTool(AiActionType.TRANSLATE_EN)}
                        disabled={isAiRefining}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors text-vex-accent hover:bg-vex-accent/10 ${isAiRefining ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <Languages size={12} /> Translate
                    </button>
                </div>
            )}
          </div>

          {inputText ? (
             <button 
                onClick={handleSend}
                className="p-3 bg-vex-500 text-white rounded-full hover:bg-vex-400 transition-all shadow-lg mb-1"
             >
                <Send size={20} className="ml-0.5" />
             </button>
          ) : (
            <button className="p-3 text-slate-400 hover:text-white transition-colors mb-1">
                <Mic size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};