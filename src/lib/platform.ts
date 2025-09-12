/**
 * Platform Detection and Native Utilities
 * Comprehensive platform detection for iOS, Android, and web with native capabilities
 */

import { Capacitor } from '@capacitor/core';

// Platform Detection
export const isNative = Capacitor.isNativePlatform();
export const isWeb = !isNative;
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';

// Browser Detection
export const isIOSBrowser = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
};

export const isSafari = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent;
  return /Safari/.test(userAgent) && !/Chrome|Chromium|Edge/.test(userAgent);
};

export const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
};

// Device Capabilities
export const hasNotch = () => {
  if (typeof window === 'undefined') return false;
  const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)')) || 0;
  return safeAreaTop > 20; // Standard status bar height is 20px
};

export const hasDynamicIsland = () => {
  if (typeof window === 'undefined') return false;
  const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)')) || 0;
  return safeAreaTop >= 59; // Dynamic Island devices have 59px safe area
};

// Safe Area Measurements
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const computedStyle = getComputedStyle(document.documentElement);
  return {
    top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)').replace('px', '')) || 0,
    right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)').replace('px', '')) || 0,
    bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)').replace('px', '')) || 0,
    left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)').replace('px', '')) || 0,
  };
};

// App Store Readiness Checks
export const getAppStoreInfo = () => {
  return {
    isNative,
    platform: Capacitor.getPlatform(),
    isAppStore: isNative && isIOS,
    isPlayStore: isNative && isAndroid,
    isPWA: isStandalone(),
    hasSafeArea: hasNotch(),
    safeAreaInsets: getSafeAreaInsets(),
  };
};

// Platform-Specific UI Configurations
export const getPlatformConfig = () => {
  const config = {
    statusBarStyle: 'default' as 'default' | 'light-content' | 'dark-content',
    navigationBarStyle: 'default' as 'default' | 'black-translucent',
    hapticFeedbackEnabled: false,
    notificationSound: 'default',
    iconBadgeEnabled: false,
  };

  if (isIOS) {
    config.statusBarStyle = 'dark-content';
    config.hapticFeedbackEnabled = true;
    config.notificationSound = 'default';
    config.iconBadgeEnabled = true;
  }

  if (isAndroid) {
    config.statusBarStyle = 'dark-content';
    config.navigationBarStyle = 'default';
    config.hapticFeedbackEnabled = true;
    config.notificationSound = 'notification.wav';
    config.iconBadgeEnabled = false;
  }

  return config;
};

// Viewport Management
export const setViewportMeta = (content: string) => {
  if (typeof document === 'undefined') return;
  
  let viewport = document.querySelector('meta[name=viewport]') as HTMLMetaElement;
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  viewport.content = content;
};

// iOS-specific viewport optimization
export const optimizeIOSViewport = () => {
  if (isIOSBrowser() || isIOS) {
    setViewportMeta('width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
};

// Android-specific viewport optimization
export const optimizeAndroidViewport = () => {
  if (isAndroid) {
    setViewportMeta('width=device-width, initial-scale=1.0, viewport-fit=cover');
  }
};

// Universal mobile viewport optimization
export const optimizeMobileViewport = () => {
  if (isNative || isIOSBrowser()) {
    optimizeIOSViewport();
  } else if (isAndroid) {
    optimizeAndroidViewport();
  }
};