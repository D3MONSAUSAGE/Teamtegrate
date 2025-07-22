import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  ripple?: boolean
  haptic?: boolean
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    ripple = false, 
    haptic = false,
    ...props 
  }, ref) => {
    const [rippleEffect, setRippleEffect] = useState<Array<{ x: number; y: number; id: string }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const isMobile = useIsMobile();

    const triggerHaptic = useCallback(() => {
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch (error) {
          // Vibration API might not be supported or allowed
        }
      }
    }, []);

    const createRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = String(Date.now() + Math.random());

      setRippleEffect(prev => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRippleEffect(prev => prev.filter(ripple => ripple.id !== id));
      }, 500);
    }, []);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Enhanced mobile handling
      if (isMobile) {
        e.currentTarget.style.transform = 'scale(0.98)';
        setTimeout(() => {
          if (e.currentTarget) {
            e.currentTarget.style.transform = '';
          }
        }, 100);
      }

      if (ripple) {
        createRipple(e);
      }
      
      if (haptic) {
        triggerHaptic();
      }
      
      props.onClick?.(e);
    }, [ripple, haptic, props.onClick, createRipple, triggerHaptic, isMobile]);

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          onClick={handleClick}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          "relative overflow-hidden transition-all duration-200",
          isMobile && "mobile-touch-target active:scale-98",
          className
        )}
        ref={ref}
        onClick={handleClick}
        style={{
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
        {...props}
      >
        {props.children}
        
        {/* Ripple effects */}
        {ripple && rippleEffect.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-current opacity-25 animate-ping pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}
      </button>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton, buttonVariants };
