/**
 * Native Button Component
 * Platform-aware button with native styling and haptic feedback
 */

import React, { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { Button, ButtonProps } from '@/components/ui/button';
import { ImpactStyle } from '@capacitor/haptics';
import { isIOS, isAndroid } from '@/lib/platform';

interface NativeButtonProps extends ButtonProps {
  children: ReactNode;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  platformStyle?: 'auto' | 'ios' | 'android' | 'web';
}

const NativeButton = forwardRef<HTMLButtonElement, NativeButtonProps>(
  ({ 
    children, 
    className, 
    hapticStyle = 'medium',
    platformStyle = 'auto',
    onClick,
    ...props 
  }, ref) => {
    const { triggerHaptic } = useNativeFeatures();

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger haptic feedback
      await triggerHaptic(ImpactStyle[hapticStyle.charAt(0).toUpperCase() + hapticStyle.slice(1) as keyof typeof ImpactStyle]);
      
      // Call original onClick handler
      onClick?.(event);
    };

    const getPlatformClasses = () => {
      const effectivePlatformStyle = platformStyle === 'auto' 
        ? (isIOS ? 'ios' : isAndroid ? 'android' : 'web')
        : platformStyle;

      switch (effectivePlatformStyle) {
        case 'ios':
          return 'touch-feedback ios-feedback mobile-touch-target';
        case 'android':
          return 'material-ripple android-touch-target';
        default:
          return 'touch-feedback mobile-touch-target';
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'mobile-optimized mobile-focus',
          getPlatformClasses(),
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

NativeButton.displayName = 'NativeButton';

export default NativeButton;