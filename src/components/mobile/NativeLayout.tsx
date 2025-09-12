/**
 * Native Layout Component
 * Provides platform-appropriate layout with safe areas and native styling
 */

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSafeArea } from './SafeAreaProvider';
import StatusBarManager from './StatusBarManager';
import { isIOS, isAndroid } from '@/lib/platform';

interface NativeLayoutProps {
  children: ReactNode;
  className?: string;
  showStatusBar?: boolean;
  statusBarStyle?: 'light' | 'dark' | 'auto';
  statusBarBackgroundColor?: string;
  useSafeArea?: boolean;
  preventHorizontalScroll?: boolean;
  nativeScrolling?: boolean;
}

const NativeLayout: React.FC<NativeLayoutProps> = ({
  children,
  className,
  showStatusBar = true,
  statusBarStyle = 'auto',
  statusBarBackgroundColor,
  useSafeArea: useSafeAreaProp = true,
  preventHorizontalScroll = true,
  nativeScrolling = true,
}) => {
  const { insets, hasNotch } = useSafeArea();

  const getLayoutClasses = () => {
    const classes = [
      'min-h-screen',
      'mobile-optimized',
    ];

    if (preventHorizontalScroll) {
      classes.push('prevent-horizontal-scroll');
    }

    if (nativeScrolling) {
      classes.push('native-scroll');
    }

    if (useSafeAreaProp) {
      classes.push('pt-safe', 'pb-safe');
    }

    // Platform-specific styles
    if (isIOS) {
      classes.push('ios-blur');
    }

    if (isAndroid) {
      classes.push('material-elevation-1');
    }

    return classes;
  };

  const layoutStyle = useSafeAreaProp ? {
    paddingTop: `max(${insets.top}px, 20px)`,
    paddingBottom: `max(${insets.bottom}px, 0px)`,
    paddingLeft: `${insets.left}px`,
    paddingRight: `${insets.right}px`,
  } : undefined;

  return (
    <>
      {showStatusBar && (
        <StatusBarManager 
          style={statusBarStyle}
          backgroundColor={statusBarBackgroundColor}
          overlay={!hasNotch}
        />
      )}
      
      <div 
        className={cn(getLayoutClasses(), className)}
        style={layoutStyle}
      >
        {children}
      </div>
    </>
  );
};

export default NativeLayout;