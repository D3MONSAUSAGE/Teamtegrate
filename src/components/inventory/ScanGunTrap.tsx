import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ScanGunTrapProps {
  handleScan: (code: string) => void;
  active?: boolean;
}

export function ScanGunTrap({ handleScan, active = true }: ScanGunTrapProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [connected, setConnected] = useState(false);
  const bufferRef = useRef<string>('');
  const lastTsRef = useRef<number>(0);

  // keep the hidden input focused so wedge scanners type into it
  useEffect(() => {
    if (!active) return;
    const focus = () => {
      inputRef.current?.focus();
      setConnected(document.activeElement === inputRef.current);
    };

    const onBlur = () => setTimeout(focus, 0);
    const onVis = () => document.visibilityState === 'visible' && focus();

    focus();
    inputRef.current?.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      inputRef.current?.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [active]);

  // prevent Tab/Enter from moving focus while scanning (capture phase)
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // If our hidden input isn't focused, force focus back immediately
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
      // Most scanners end with Enter; many also send Tab depending on config.
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKeyDown, /* capture */ true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [active]);

  // collect characters quickly typed by the wedge and emit on Enter
  const onKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!active) return;
    const now = Date.now();

    // Reset buffer if the gap is too long (human typing)
    if (now - lastTsRef.current > 80) bufferRef.current = '';

    lastTsRef.current = now;

    if (e.key === 'Enter') {
      const code = bufferRef.current;
      bufferRef.current = '';
      (e.target as HTMLInputElement).value = '';
      if (code) handleScan(code);
      return;
    }

    if (e.key.length === 1) {
      bufferRef.current += e.key;
    }
  }, [active, handleScan]);

  // also keep focus when the user clicks anywhere in the scan panel
  const reFocus = () => inputRef.current?.focus();

  return (
    <div onClick={reFocus}>
      {/* status pill you can show in your UI */}
      <div
        style={{
          fontSize: 12,
          color: connected ? '#166534' : '#6b7280',
          marginBottom: 8,
        }}
      >
        {connected ? 'Scanner connected' : 'Waiting for scanner…'}
      </div>

      <input
        ref={inputRef}
        type="text"
        autoFocus
        aria-hidden
        onKeyUp={onKeyUp}
        // invisible but focusable
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
