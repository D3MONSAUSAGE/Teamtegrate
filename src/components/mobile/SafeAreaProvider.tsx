/**
 * Safe Area Provider Component
 * Provides safe area context and utilities for the entire app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSafeAreaInsets, optimizeMobileViewport } from '@/lib/platform';

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface SafeAreaContextType {
  insets: SafeAreaInsets;
  hasNotch: boolean;
  hasDynamicIsland: boolean;
  statusBarHeight: number;
  bottomSafeArea: number;
}

const SafeAreaContext = createContext<SafeAreaContextType>({
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  hasNotch: false,
  hasDynamicIsland: false,
  statusBarHeight: 0,
  bottomSafeArea: 0,
});

export const useSafeArea = () => {
  const context = useContext(SafeAreaContext);
  if (!context) {
    throw new Error('useSafeArea must be used within a SafeAreaProvider');
  }
  return context;
};

interface SafeAreaProviderProps {
  children: ReactNode;
}

export const SafeAreaProvider: React.FC<SafeAreaProviderProps> = ({ children }) => {
  const [insets, setInsets] = useState<SafeAreaInsets>({ top: 0, right: 0, bottom: 0, left: 0 });

  useEffect(() => {
    // Optimize viewport for mobile
    optimizeMobileViewport();

    // Update safe area insets
    const updateInsets = () => {
      const newInsets = getSafeAreaInsets();
      setInsets(newInsets);
    };

    // Initial update
    updateInsets();

    // Listen for orientation changes
    window.addEventListener('orientationchange', updateInsets);
    window.addEventListener('resize', updateInsets);

    // Cleanup
    return () => {
      window.removeEventListener('orientationchange', updateInsets);
      window.removeEventListener('resize', updateInsets);
    };
  }, []);

  const value: SafeAreaContextType = {
    insets,
    hasNotch: insets.top > 20,
    hasDynamicIsland: insets.top >= 59,
    statusBarHeight: Math.max(insets.top, 20),
    bottomSafeArea: Math.max(insets.bottom, 0),
  };

  return (
    <SafeAreaContext.Provider value={value}>
      {children}
    </SafeAreaContext.Provider>
  );
};