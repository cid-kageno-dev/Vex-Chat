import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { AiActionType, Message, User } from '../types';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_BOT = `You are an intelligent assistant integrated into VexChat, a modern messaging app. 
Your goal is to be helpful, concise, and friendly. 
When asked to perform tasks, do so efficiently. 
If the user is chatting casually, engage them naturally.`;

// Service for the "Gemini" bot chat
export const sendGeminiMessage = async (
  history: { role: 'user' | 'model', parts: [{ text: string }] }[],
  newMessage: string
): Promise<AsyncGenerator<string, void, unknown>> => {

  const chatSession: Chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_BOT,
    },
    history: history,
  });

  const result = await chatSession.sendMessageStream({ message: newMessage });

  // Return a generator that yields text chunks
  async function* streamGenerator() {
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  }

  return streamGenerator();
};

// Service for AI Actions (Rewrite, Fix Grammar, etc.)
export const performAiAction = async (text: string, action: AiActionType): Promise<string> => {
  let prompt = '';

  switch (action) {
    case AiActionType.REWRITE_PROFESSIONAL:
      prompt = `Rewrite the following text to be more professional, polite, and concise:\n\n"${text}"`;
      break;
    case AiActionType.REWRITE_FRIENDLY:
      prompt = `Rewrite the following text to be more friendly, casual, and warm:\n\n"${text}"`;
      break;
    case AiActionType.FIX_GRAMMAR:
      prompt = `Fix any grammar or spelling errors in the following text. Do not change the tone or meaning. Return only the corrected text:\n\n"${text}"`;
      break;
    case AiActionType.TRANSLATE_EN:
      prompt = `Translate the following text to English. If it is already English, just return it as is:\n\n"${text}"`;
      break;
    case AiActionType.SUMMARIZE:
      prompt = `Summarize the following content briefly:\n\n"${text}"`;
      break;
    case AiActionType.EXPLAIN:
      prompt = `Explain the meaning or context of the following text simply:\n\n"${text}"`;
      break;
    default:
      return text;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || text;
  } catch (error) {
    console.error("Gemini AI Action Error:", error);
    return "Sorry, I couldn't process that request right now.";
  }
};

export const summarizeConversation = async (messages: Message[], participants: User[]): Promise<string> => {
  const conversationText = messages.map(m => {
    const senderName = participants.find(p => p.id === m.senderId)?.name || 'Unknown';
    return `${senderName}: ${m.text}`;
  }).join('\n');

  const prompt = `Summarize the following conversation history. Capture the key points, decisions made, and pending items if any. Keep it concise:\n\n${conversationText}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Summary error:", error);
    return "Unable to summarize conversation at this time.";
  }
};

export const generateSmartReplies = async (messages: Message[], participants: User[], currentUserId: string): Promise<string[]> => {
  // Only use the last few messages for context to be efficient
  const recentMessages = messages.slice(-10);
  
  const conversationContext = recentMessages.map(m => {
    const sender = participants.find(p => p.id === m.senderId);
    const name = sender ? sender.name : 'Unknown';
    const role = m.senderId === currentUserId ? 'Me' : name;
    return `${role}: ${m.text}`;
  }).join('\n');

  const prompt = `Based on the following conversation, suggest 3 short, natural, and contextually relevant quick replies that "Me" could send next.
  
  Conversation:
  ${conversationContext}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
    console.error("Smart Reply Error:", error);
    return [];
  }
};