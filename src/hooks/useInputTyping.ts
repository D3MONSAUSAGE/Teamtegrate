import { useCallback, useRef } from 'react';

interface UseInputTypingProps {
  onStartTyping: () => void;
  onStopTyping: () => void;
  debounceMs?: number;
}

export function useInputTyping({
  onStartTyping,
  onStopTyping,
  debounceMs = 500
}: UseInputTypingProps) {
  const isTypingRef = useRef(false);
  const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = useCallback((value: string) => {
    // Start typing if not already
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onStartTyping();
    }

    // Clear existing timeout
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    stopTypingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onStopTyping();
      }
    }, debounceMs);
  }, [onStartTyping, onStopTyping, debounceMs]);

  const handleInputFocus = useCallback(() => {
    // Don't automatically start typing on focus
    // Only start when user actually types
  }, []);

  const handleInputBlur = useCallback(() => {
    // Stop typing when input loses focus
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }
    
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onStopTyping();
    }
  }, [onStopTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle special keys
    if (e.key === 'Enter' && !e.shiftKey) {
      // Stop typing when sending message
      if (stopTypingTimeoutRef.current) {
        clearTimeout(stopTypingTimeoutRef.current);
      }
      
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onStopTyping();
      }
    }
  }, [onStopTyping]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }
  }, []);

  return {
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleKeyDown,
    cleanup
  };
}