/**
 * Chat Store - Zustand
 * Based on PRD-UI.md specifications for transcript chat interface
 */
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  transcript_id?: string;
  metadata?: {
    actions_extracted?: number;
    processing_status?: string;
    confidence?: number;
  };
}

export interface TranscriptItem {
  id: string;
  title: string;
  transcript_text: string;
  snippet: string;
  source: 'upload' | 'limitless';
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  audio_url?: string;
  limitless_id?: string;
  actions_count?: number;
}

interface ChatState {
  // State
  messages: ChatMessage[];
  transcripts: TranscriptItem[];
  selectedTranscript: TranscriptItem | null;
  isStreaming: boolean;
  isLoading: boolean;
  currentInput: string;
  
  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  
  setTranscripts: (transcripts: TranscriptItem[]) => void;
  addTranscript: (transcript: TranscriptItem) => void;
  updateTranscript: (id: string, updates: Partial<TranscriptItem>) => void;
  removeTranscript: (id: string) => void;
  selectTranscript: (transcript: TranscriptItem | null) => void;
  
  setStreaming: (streaming: boolean) => void;
  setLoading: (loading: boolean) => void;
  setCurrentInput: (input: string) => void;
  
  sendMessage: (content: string) => Promise<void>;
  streamAI: (prompt: string) => Promise<void>;
  processTranscript: (transcriptId: string) => Promise<void>;
}

export const chatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  transcripts: [],
  selectedTranscript: null,
  isStreaming: false,
  isLoading: false,
  currentInput: '',
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (messageData) => set((state) => {
    const message: ChatMessage = {
      ...messageData,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    return {
      messages: [...state.messages, message]
    };
  }),
  
  updateLastMessage: (content) => set((state) => {
    const messages = [...state.messages];
    if (messages.length > 0) {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content
      };
    }
    return { messages };
  }),
  
  clearMessages: () => set({ messages: [] }),
  
  setTranscripts: (transcripts) => set({ transcripts }),
  
  addTranscript: (transcript) => set((state) => ({
    transcripts: [transcript, ...state.transcripts]
  })),
  
  updateTranscript: (id, updates) => set((state) => ({
    transcripts: state.transcripts.map(t =>
      t.id === id ? { ...t, ...updates } : t
    )
  })),
  
  removeTranscript: (id) => set((state) => ({
    transcripts: state.transcripts.filter(t => t.id !== id),
    selectedTranscript: state.selectedTranscript?.id === id ? null : state.selectedTranscript
  })),
  
  selectTranscript: (transcript) => set({ selectedTranscript: transcript }),
  
  setStreaming: (isStreaming) => set({ isStreaming }),
  setLoading: (isLoading) => set({ isLoading }),
  setCurrentInput: (currentInput) => set({ currentInput }),
  
  sendMessage: async (content) => {
    const { addMessage, setLoading } = get();
    
    try {
      setLoading(true);
      
      // Add user message
      addMessage({
        role: 'user',
        content,
      });
      
      // TODO: Send to API and get response
      // const response = await sendChatMessage(content);
      
      // Add assistant response (mock for now)
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: `I received your message: "${content}". This is a mock response.`,
        });
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      addMessage({
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      setLoading(false);
    }
  },
  
  streamAI: async (prompt) => {
    const { addMessage, setStreaming, updateLastMessage } = get();
    
    try {
      setStreaming(true);
      
      // Add assistant message placeholder
      addMessage({
        role: 'assistant',
        content: '',
      });
      
      // TODO: Implement actual streaming
      // For now, simulate streaming
      const fullResponse = `Streaming response to: "${prompt}". This would be a real AI response in production.`;
      
      for (let i = 0; i <= fullResponse.length; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 50));
        updateLastMessage(fullResponse.slice(0, i));
      }
      
      setStreaming(false);
      
    } catch (error) {
      addMessage({
        role: 'system',
        content: `Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      setStreaming(false);
    }
  },
  
  processTranscript: async (transcriptId) => {
    const { updateTranscript, addMessage } = get();
    
    try {
      updateTranscript(transcriptId, { status: 'processing' });
      
      // TODO: Call actual MCP processing endpoint
      // const result = await processTranscriptAPI(transcriptId);
      
      // Mock processing
      setTimeout(() => {
        updateTranscript(transcriptId, { 
          status: 'completed',
          actions_count: Math.floor(Math.random() * 5) + 1
        });
        
        addMessage({
          role: 'system',
          content: `Transcript ${transcriptId} processed successfully!`,
          transcript_id: transcriptId,
          metadata: {
            processing_status: 'completed',
            actions_extracted: Math.floor(Math.random() * 5) + 1,
            confidence: 0.85 + Math.random() * 0.1
          }
        });
      }, 2000);
      
    } catch (error) {
      updateTranscript(transcriptId, { status: 'failed' });
      addMessage({
        role: 'system',
        content: `Failed to process transcript: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },
}));

// Hook for easy consumption
export const useChatStore = () => chatStore();