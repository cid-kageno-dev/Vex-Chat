import React, { useState } from 'react';
import { Message, User, AiActionType } from '../types';
import { format } from 'date-fns';
import { Check, CheckCheck, Sparkles, MoreHorizontal, Copy, RefreshCw, Languages, Search, SmilePlus } from 'lucide-react';
import { performAiAction } from '../services/geminiService';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  sender: User;
  onReact: (emoji: string) => void;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, sender, onReact }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{type: string, text: string} | null>(null);

  const handleAiAction = async (action: AiActionType) => {
    setIsProcessing(true);
    setShowMenu(false);
    const result = await performAiAction(message.text, action);
    setAiResult({ type: action, text: result });
    setIsProcessing(false);
  };

  const closeAiResult = () => setAiResult(null);

  const toggleReactionPicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReactionPicker(!showReactionPicker);
    setShowMenu(false);
  };

  const handleEmojiClick = (emoji: string) => {
    onReact(emoji);
    setShowReactionPicker(false);
  };

  return (
    <div 
      className={`group flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}
      onMouseLeave={() => { setShowMenu(false); setShowReactionPicker(false); }}
    >
      <div className={`max-w-[75%] sm:max-w-[60%] relative`}>
        {/* Sender Name if Group */}
        {!isMe && <p className="text-xs text-slate-400 mb-1 ml-1">{sender.name}</p>}
        
        {/* Bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed ${
            isMe 
              ? 'bg-vex-500 text-white rounded-tr-none' 
              : 'bg-vex-700 text-slate-100 rounded-tl-none'
          } ${message.isAiGenerated ? 'border border-vex-accent shadow-[0_0_10px_rgba(139,92,246,0.2)]' : ''}`}
        >
          {message.text}

          {/* Timestamp & Status */}
          <div className={`flex items-center justify-end gap-1 mt-1 select-none text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
            <span>{format(message.timestamp, 'HH:mm')}</span>
            {isMe && (
              <span>
                {message.status === 'read' ? <CheckCheck size={12} /> : <Check size={12} />}
              </span>
            )}
          </div>

          {/* Reactions Display */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute -bottom-4 ${isMe ? 'right-0' : 'left-0'} flex gap-1 z-10`}>
                {message.reactions.map(r => (
                    <button 
                        key={r.emoji}
                        onClick={() => onReact(r.emoji)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border shadow-sm transition-transform hover:scale-110 ${r.userReacted ? 'bg-vex-600 border-vex-500 text-white' : 'bg-vex-800 border-vex-700 text-slate-300'}`}
                    >
                        <span>{r.emoji}</span>
                        {r.count > 1 && <span className="text-[10px] font-bold">{r.count}</span>}
                    </button>
                ))}
            </div>
          )}
        </div>

        {/* AI Result Popover */}
        {aiResult && (
          <div className="mt-2 p-3 bg-slate-800 rounded-lg border border-vex-600 shadow-lg text-sm animate-fade-in z-20 relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-vex-400 uppercase tracking-wider">{aiResult.type.replace('_', ' ')}</span>
              <button onClick={closeAiResult} className="text-slate-500 hover:text-white">&times;</button>
            </div>
            <p className="text-slate-300">{aiResult.text}</p>
          </div>
        )}

        {/* Actions Button (Hover) */}
        <div className={`absolute -top-6 ${isMe ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-20`}>
          
          {/* Reaction Picker Button */}
          <div className="relative">
             <button
                onClick={toggleReactionPicker}
                className="p-1.5 rounded-full bg-vex-800 border border-vex-700 hover:bg-vex-700 text-slate-400 hover:text-yellow-400 transition-colors shadow-md"
                title="Add Reaction"
             >
                <SmilePlus size={14} />
             </button>

             {/* Emoji Picker Popover */}
             {showReactionPicker && (
                <div className={`absolute top-full mt-2 ${isMe ? 'right-0' : 'left-0'} bg-vex-800 border border-vex-700 rounded-full shadow-xl flex items-center p-1 gap-1 animate-fade-in`}>
                    {REACTIONS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => handleEmojiClick(emoji)}
                            className="p-2 hover:bg-vex-700 rounded-full transition-transform hover:scale-125 text-lg leading-none"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
             )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full bg-vex-800 border border-vex-700 hover:bg-vex-700 text-slate-400 hover:text-white transition-colors shadow-md"
            >
              <MoreHorizontal size={14} />
            </button>
            
            {/* Context Menu */}
            {showMenu && (
              <div className={`absolute top-full mt-2 ${isMe ? 'right-0' : 'left-0'} w-48 bg-slate-800 rounded-lg shadow-xl border border-vex-700 py-1 overflow-hidden flex flex-col`}>
                <button onClick={() => handleAiAction(AiActionType.TRANSLATE_EN)} className="flex items-center gap-2 px-3 py-2 text-left hover:bg-vex-700 text-slate-300 hover:text-white text-xs">
                    <Languages size={14} /> Translate
                </button>
                <button onClick={() => handleAiAction(AiActionType.EXPLAIN)} className="flex items-center gap-2 px-3 py-2 text-left hover:bg-vex-700 text-slate-300 hover:text-white text-xs">
                    <Search size={14} /> Explain
                </button>
                <button onClick={() => handleAiAction(AiActionType.SUMMARIZE)} className="flex items-center gap-2 px-3 py-2 text-left hover:bg-vex-700 text-slate-300 hover:text-white text-xs">
                    <RefreshCw size={14} /> Summarize
                </button>
                <div className="h-px bg-vex-700 my-1"></div>
                 <button onClick={() => navigator.clipboard.writeText(message.text)} className="flex items-center gap-2 px-3 py-2 text-left hover:bg-vex-700 text-slate-300 hover:text-white text-xs">
                    <Copy size={14} /> Copy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};