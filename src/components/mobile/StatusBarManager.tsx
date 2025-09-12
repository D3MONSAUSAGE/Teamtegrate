/**
 * Status Bar Manager Component
 * Manages status bar appearance and safe area integration
 */

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { isIOS, isNative, hasNotch, hasDynamicIsland } from '@/lib/platform';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';

interface StatusBarManagerProps {
  backgroundColor?: string;
  overlay?: boolean;
  style?: 'light' | 'dark' | 'auto';
}

const StatusBarManager: React.FC<StatusBarManagerProps> = ({
  backgroundColor,
  overlay = false,
  style = 'auto'
}) => {
  const { theme } = useTheme();
  const { setStatusBarStyle } = useNativeFeatures();

  // Status bar style management
  useEffect(() => {
    if (!isNative) return;

    const getStatusBarStyle = () => {
      if (style === 'auto') {
        return theme === 'dark' ? StatusBarStyle.Light : StatusBarStyle.Dark;
      }
      return style === 'light' ? StatusBarStyle.Light : StatusBarStyle.Dark;
    };

    setStatusBarStyle(getStatusBarStyle());

    // Set background color if specified
    if (backgroundColor && isNative) {
      StatusBar.setBackgroundColor({ color: backgroundColor }).catch(console.log);
    }

    // Set overlay mode
    if (isNative) {
      StatusBar.setOverlaysWebView({ overlay }).catch(console.log);
    }
  }, [theme, style, backgroundColor, overlay, setStatusBarStyle]);

  // iOS status bar overlay for web
  if (!isNative && (hasNotch() || hasDynamicIsland())) {
    return (
      <div 
        className="status-bar-overlay"
        style={{ 
          backgroundColor: backgroundColor || 'hsl(var(--background))',
        }}
      />
    );
  }

  return null;
};

export default StatusBarManager;