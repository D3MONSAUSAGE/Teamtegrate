import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface ChatBubbleState {
  isOpen: boolean;
  activeTab: 'ai' | 'team';
  selectedRoomId: string | null;
  position: 'bottom-right' | 'bottom-left' | 'center';
  size: 'compact' | 'expanded';
}

interface ChatBubbleContextType {
  state: ChatBubbleState;
  actions: {
    toggleBubble: () => void;
    closeBubble: () => void;
    openBubble: () => void;
    setActiveTab: (tab: 'ai' | 'team') => void;
    setSelectedRoomId: (roomId: string | null) => void;
    setPosition: (position: ChatBubbleState['position']) => void;
    setSize: (size: ChatBubbleState['size']) => void;
  };
}

const ChatBubbleContext = createContext<ChatBubbleContextType | undefined>(undefined);

export const useChatBubble = () => {
  const context = useContext(ChatBubbleContext);
  if (!context) {
    throw new Error('useChatBubble must be used within a ChatBubbleProvider');
  }
  return context;
};

interface ChatBubbleProviderProps {
  children: ReactNode;
}

export const ChatBubbleProvider: React.FC<ChatBubbleProviderProps> = ({ children }) => {
  const [state, setState] = useState<ChatBubbleState>(() => {
    // Load saved state from localStorage
    const savedState = localStorage.getItem('chatBubbleState');
    const defaultState: ChatBubbleState = {
      isOpen: false,
      activeTab: 'ai',
      selectedRoomId: null,
      position: 'bottom-right',
      size: 'compact'
    };
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return { ...defaultState, ...parsed, isOpen: false }; // Always start closed
      } catch {
        return defaultState;
      }
    }
    
    return defaultState;
  });

  // Save state to localStorage whenever it changes (except isOpen)
  const updateState = useCallback((newState: Partial<ChatBubbleState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState };
      const { isOpen, ...persistentState } = updated;
      localStorage.setItem('chatBubbleState', JSON.stringify(persistentState));
      return updated;
    });
  }, []);

  const actions = {
    toggleBubble: useCallback(() => {
      updateState({ isOpen: !state.isOpen });
    }, [state.isOpen, updateState]),

    closeBubble: useCallback(() => {
      updateState({ isOpen: false });
    }, [updateState]),

    openBubble: useCallback(() => {
      updateState({ isOpen: true });
    }, [updateState]),

    setActiveTab: useCallback((tab: 'ai' | 'team') => {
      updateState({ activeTab: tab });
    }, [updateState]),

    setSelectedRoomId: useCallback((roomId: string | null) => {
      updateState({ selectedRoomId: roomId });
    }, [updateState]),

    setPosition: useCallback((position: ChatBubbleState['position']) => {
      updateState({ position });
    }, [updateState]),

    setSize: useCallback((size: ChatBubbleState['size']) => {
      updateState({ size });
    }, [updateState])
  };

  return (
    <ChatBubbleContext.Provider value={{ state, actions }}>
      {children}
    </ChatBubbleContext.Provider>
  );
};