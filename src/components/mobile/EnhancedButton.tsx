
import React, { useState, useCallback } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedButtonProps extends ButtonProps {
  ripple?: boolean;
  haptic?: boolean;
  children?: React.ReactNode;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  className,
  ripple = true,
  haptic = true,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rippleId = Date.now();
      
      setRipples(prev => [...prev, { id: rippleId, x, y }]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== rippleId));
      }, 600);
    }

    // Enhanced haptic feedback
    if (haptic && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch (error) {
        console.debug('Haptic feedback not available');
      }
    }

    onClick?.(e);
  }, [onClick, ripple, haptic]);

  return (
    <Button
      {...props}
      className={cn(
        "relative overflow-hidden touch-manipulation select-none",
        "active:scale-95 transition-all duration-150 ease-out",
        "shadow-sm hover:shadow-md active:shadow-sm",
        "transform-gpu will-change-transform",
        className
      )}
      onClick={handleClick}
    >
      {children}
      
      {/* Enhanced ripple effects */}
      {ripple && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/40 pointer-events-none"
          style={{
            left: ripple.x - 12,
            top: ripple.y - 12,
            width: 24,
            height: 24,
            animation: 'ripple-expand 0.6s ease-out forwards'
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes ripple-expand {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </Button>
  );
};

export default EnhancedButton;
