
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useIsMobile } from './use-mobile';

interface NativePlatformState {
  isNativePlatform: boolean;
  isMobile: boolean;
  isNativeAndMobile: boolean;
  platform: 'web' | 'ios' | 'android';
}

export const useNativePlatform = (): NativePlatformState => {
  const isMobile = useIsMobile();
  const [state, setState] = useState<NativePlatformState>({
    isNativePlatform: false,
    isMobile,
    isNativeAndMobile: false,
    platform: 'web'
  });

  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
    
    setState({
      isNativePlatform,
      isMobile,
      isNativeAndMobile: isNativePlatform && isMobile,
      platform
    });
  }, [isMobile]);

  return state;
};
