/**
 * Native Features Hook
 * Provides access to native mobile capabilities with fallbacks
 */

import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { isIOS, isAndroid, isNative, getPlatformConfig } from '@/lib/platform';

interface NativeFeatures {
  // Haptic Feedback
  triggerHaptic: (style?: ImpactStyle) => Promise<void>;
  triggerSelectionHaptic: () => Promise<void>;
  triggerNotificationHaptic: (type?: 'success' | 'warning' | 'error') => Promise<void>;
  
  // Status Bar
  setStatusBarStyle: (style: StatusBarStyle) => Promise<void>;
  hideStatusBar: () => Promise<void>;
  showStatusBar: () => Promise<void>;
  
  // Keyboard
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  hideKeyboard: () => Promise<void>;
  
  // Platform Info
  platform: string;
  isNativePlatform: boolean;
  platformConfig: ReturnType<typeof getPlatformConfig>;
}

export const useNativeFeatures = (): NativeFeatures => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [platformConfig] = useState(() => getPlatformConfig());

  // Haptic Feedback
  const triggerHaptic = useCallback(async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isNative || !platformConfig.hapticFeedbackEnabled) {
      // Web fallback - vibration API
      if ('vibrator' in navigator || 'vibrate' in navigator) {
        const vibrationMap = {
          [ImpactStyle.Light]: 10,
          [ImpactStyle.Medium]: 20,
          [ImpactStyle.Heavy]: 30,
        };
        navigator.vibrate?.(vibrationMap[style] || 20);
      }
      return;
    }

    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  }, [platformConfig.hapticFeedbackEnabled]);

  const triggerSelectionHaptic = useCallback(async () => {
    if (!isNative) {
      navigator.vibrate?.(10);
      return;
    }

    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.log('Selection haptic not available:', error);
    }
  }, []);

  const triggerNotificationHaptic = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!isNative) {
      const vibrationMap = {
        success: [100, 50, 100],
        warning: [100, 50, 100, 50, 100],
        error: [200, 100, 200],
      };
      navigator.vibrate?.(vibrationMap[type]);
      return;
    }

    try {
      const notificationMap = {
        success: 'SUCCESS' as const,
        warning: 'WARNING' as const,
        error: 'ERROR' as const,
      };
      await Haptics.notification({ type: notificationMap[type] as any });
    } catch (error) {
      console.log('Notification haptic not available:', error);
    }
  }, []);

  // Status Bar
  const setStatusBarStyle = useCallback(async (style: StatusBarStyle) => {
    if (!isNative) return;

    try {
      await StatusBar.setStyle({ style });
    } catch (error) {
      console.log('Status bar style not available:', error);
    }
  }, []);

  const hideStatusBar = useCallback(async () => {
    if (!isNative) return;

    try {
      await StatusBar.hide();
    } catch (error) {
      console.log('Hide status bar not available:', error);
    }
  }, []);

  const showStatusBar = useCallback(async () => {
    if (!isNative) return;

    try {
      await StatusBar.show();
    } catch (error) {
      console.log('Show status bar not available:', error);
    }
  }, []);

  // Keyboard
  const hideKeyboard = useCallback(async () => {
    if (!isNative) {
      // Web fallback - blur active element
      (document.activeElement as HTMLElement)?.blur();
      return;
    }

    try {
      await Keyboard.hide();
    } catch (error) {
      console.log('Hide keyboard not available:', error);
    }
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    if (!isNative) return;

    let keyboardWillShowListener: any;
    let keyboardWillHideListener: any;

    const setupListeners = async () => {
      keyboardWillShowListener = await Keyboard.addListener('keyboardWillShow', (info) => {
        setKeyboardHeight(info.keyboardHeight);
        setIsKeyboardVisible(true);
      });

      keyboardWillHideListener = await Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      });
    };

    setupListeners();

    return () => {
      if (keyboardWillShowListener) {
        keyboardWillShowListener.remove();
      }
      if (keyboardWillHideListener) {
        keyboardWillHideListener.remove();
      }
    };
  }, []);

  // Initialize native features
  useEffect(() => {
    if (!isNative) return;

    // Set initial status bar style
    setStatusBarStyle(
      platformConfig.statusBarStyle === 'dark-content' 
        ? StatusBarStyle.Dark 
        : StatusBarStyle.Light
    );
  }, [setStatusBarStyle, platformConfig.statusBarStyle]);

  return {
    triggerHaptic,
    triggerSelectionHaptic,
    triggerNotificationHaptic,
    setStatusBarStyle,
    hideStatusBar,
    showStatusBar,
    keyboardHeight,
    isKeyboardVisible,
    hideKeyboard,
    platform: Capacitor.getPlatform(),
    isNativePlatform: isNative,
    platformConfig,
  };
};