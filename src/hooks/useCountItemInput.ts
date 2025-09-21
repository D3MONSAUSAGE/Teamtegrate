import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/utils/performanceUtils';
import { toast } from 'sonner';

export interface UseCountItemInputProps {
  itemId: string;
  initialValue: number | null;
  onUpdate: (itemId: string, value: number) => Promise<void>;
  debounceMs?: number;
}

export interface CountItemInputState {
  displayValue: string;
  isSaving: boolean;
  hasError: boolean;
  lastSavedValue: number | null;
}

export const useCountItemInput = ({
  itemId,
  initialValue,
  onUpdate,
  debounceMs = 500
}: UseCountItemInputProps) => {
  const [state, setState] = useState<CountItemInputState>({
    displayValue: initialValue?.toString() || '',
    isSaving: false,
    hasError: false,
    lastSavedValue: initialValue
  });

  // Initialize display value only once on mount - don't reset while user is typing

  // Debounced API call
  const debouncedUpdate = useDebounce(async (value: number) => {
    setState(prev => ({ ...prev, isSaving: true, hasError: false }));
    
    try {
      await onUpdate(itemId, value);
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        lastSavedValue: value,
        hasError: false 
      }));
    } catch (error) {
      console.error('Failed to update count:', error);
      setState(prev => ({ 
        ...prev, 
        isSaving: false, 
        hasError: true 
      }));
      toast.error('Failed to save quantity. Please try again.');
    }
  }, debounceMs);

  // Handle input change with immediate UI update
  const handleChange = useCallback((inputValue: string) => {
    setState(prev => ({ ...prev, displayValue: inputValue }));
    
    // Parse and validate the number
    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue) && numericValue >= 0) {
      // Only call API if value actually changed
      if (numericValue !== state.lastSavedValue) {
        debouncedUpdate(numericValue);
      }
    }
  }, [debouncedUpdate, state.lastSavedValue]);

  // Handle blur to ensure we have a valid number
  const handleBlur = useCallback(() => {
    const numericValue = parseFloat(state.displayValue);
    if (isNaN(numericValue) || numericValue < 0) {
      // Revert to last saved value on invalid input
      setState(prev => ({
        ...prev,
        displayValue: prev.lastSavedValue?.toString() || '',
        hasError: false
      }));
    }
  }, [state.displayValue, state.lastSavedValue]);

  // Handle enter key to immediately save
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const numericValue = parseFloat(state.displayValue);
      if (!isNaN(numericValue) && numericValue >= 0) {
        // Update immediately on Enter key
        setState(prev => ({ ...prev, isSaving: true }));
        onUpdate(itemId, numericValue)
          .then(() => {
            setState(prev => ({ 
              ...prev, 
              isSaving: false, 
              lastSavedValue: numericValue,
              hasError: false 
            }));
          })
          .catch(() => {
            setState(prev => ({ 
              ...prev, 
              isSaving: false, 
              hasError: true 
            }));
            toast.error('Failed to save quantity. Please try again.');
          });
      }
    }
  }, [state.displayValue, onUpdate, itemId]);

  return {
    displayValue: state.displayValue,
    isSaving: state.isSaving,
    hasError: state.hasError,
    hasUnsavedChanges: state.displayValue !== (state.lastSavedValue?.toString() || ''),
    handleChange,
    handleBlur,
    handleKeyDown
  };
};