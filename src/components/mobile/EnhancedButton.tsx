
import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedButtonProps extends ButtonProps {
  ripple?: boolean;
  haptic?: boolean;
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

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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

    // Simulate haptic feedback
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    onClick?.(e);
  };

  return (
    <Button
      {...props}
      className={cn(
        "relative overflow-hidden",
        "active:scale-95 transition-all duration-150",
        "shadow-lg hover:shadow-xl",
        className
      )}
      onClick={handleClick}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animation: 'ripple 0.6s ease-out forwards'
          }}
        />
      ))}
    </Button>
  );
};

export default EnhancedButton;
