import { useState, useEffect, useCallback, useRef } from 'react';

interface ScanGunResult {
  code: string;
  suffix: 'enter' | 'tab' | 'timeout';
}

interface UseScanGunProps {
  onScan: (code: string) => void;
  onStart?: () => void;
  onStop?: () => void;
  enabled?: boolean;
  minLength?: number;
  maxInterKeyDelay?: number;
  endTimeout?: number;
}

export const useScanGun = ({
  onScan,
  onStart,
  onStop,
  enabled = true,
  minLength = 4,
  maxInterKeyDelay = 25,
  endTimeout = 100
}: UseScanGunProps) => {
  const [isListening, setIsListening] = useState(false);
  const [scannerConnected, setScannerConnected] = useState(false);
  
  const bufferRef = useRef<string>('');
  const timestampsRef = useRef<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);
  
  const resetBuffer = useCallback(() => {
    bufferRef.current = '';
    timestampsRef.current = [];
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const processScan = useCallback((suffix: 'enter' | 'tab' | 'timeout') => {
    const code = bufferRef.current.trim();
    
    if (code.length >= minLength) {
      console.log('SCANGUN_DETECTED:', { code, suffix, length: code.length });
      
      // Check if timing indicates scanner (fast consecutive keystrokes)
      if (timestampsRef.current.length > 1) {
        const intervals = timestampsRef.current.slice(1).map((time, i) => 
          time - timestampsRef.current[i]
        );
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        if (avgInterval <= maxInterKeyDelay) {
          setScannerConnected(true);
          onScan(code);
        }
      }
    }
    
    resetBuffer();
  }, [minLength, maxInterKeyDelay, onScan, resetBuffer]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !isListening) return;
    
    // Skip if focused on text input (except our hidden input)
    const activeElement = document.activeElement;
    if (activeElement && 
        activeElement.tagName === 'INPUT' && 
        !activeElement.classList.contains('scangun-input') &&
        (activeElement as HTMLInputElement).type !== 'hidden') {
      return;
    }
    
    if (activeElement && ['TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
      return;
    }
    
    const now = Date.now();
    
    // Handle end characters
    if (event.key === 'Enter') {
      event.preventDefault();
      processScan('enter');
      return;
    }
    
    if (event.key === 'Tab') {
      event.preventDefault();
      processScan('tab');
      return;
    }
    
    // Skip control keys
    if (event.key.length > 1) {
      return;
    }
    
    // Start new buffer if it's been too long since last keystroke
    if (now - lastActivityRef.current > 200) {
      resetBuffer();
      onStart?.();
    }
    
    // Add character to buffer
    bufferRef.current += event.key;
    timestampsRef.current.push(now);
    lastActivityRef.current = now;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for end detection
    timeoutRef.current = setTimeout(() => {
      processScan('timeout');
      onStop?.();
    }, endTimeout);
    
  }, [enabled, isListening, processScan, resetBuffer, endTimeout, onStart, onStop]);

  useEffect(() => {
    if (enabled) {
      setIsListening(true);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        resetBuffer();
      };
    } else {
      setIsListening(false);
      resetBuffer();
    }
  }, [enabled, handleKeyDown, resetBuffer]);

  const reset = useCallback(() => {
    resetBuffer();
    setScannerConnected(false);
  }, [resetBuffer]);

  return {
    isListening,
    scannerConnected,
    reset
  };
};