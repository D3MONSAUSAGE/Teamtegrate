
import React, { createContext, useContext, ReactNode } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsContextType {
  showShortcutsHelp: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export const useKeyboardShortcutsContext = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  }
  return context;
};

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
  onNewTask?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
}

export const KeyboardShortcutsProvider: React.FC<KeyboardShortcutsProviderProps> = ({
  children,
  onNewTask,
  onSearch,
  onRefresh
}) => {
  const { showShortcutsHelp } = useKeyboardShortcuts({
    onNewTask,
    onSearch,
    onRefresh
  });

  return (
    <KeyboardShortcutsContext.Provider value={{ showShortcutsHelp }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};
