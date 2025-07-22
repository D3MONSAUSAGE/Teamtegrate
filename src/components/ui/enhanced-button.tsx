
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:underline",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px] md:min-h-[40px]",
        sm: "h-9 rounded-md px-3 min-h-[44px] md:min-h-[36px]",
        lg: "h-11 rounded-md px-8 min-h-[48px] md:min-h-[44px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px]",
      },
      haptic: {
        true: "",
        false: "",
      },
      ripple: {
        true: "",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      haptic: true,
      ripple: true,
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean
  haptic?: boolean
  ripple?: boolean
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, asChild = false, haptic = true, ripple = true, onClick, children, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    const Comp = asChild ? Slot : "button"

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Handle ripple effect
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

      // Handle haptic feedback for mobile devices
      if (haptic && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch (error) {
          // Silently fail if vibration is not supported
          console.debug('Haptic feedback not available');
        }
      }

      // Call the original onClick handler
      onClick?.(e);
    }, [onClick, ripple, haptic]);

    return (
      <Comp
        className={cn(
          enhancedButtonVariants({ variant, size, className }),
          "active:scale-95 touch-manipulation select-none",
          "transform-gpu will-change-transform",
          "shadow-sm hover:shadow-md active:shadow-sm",
          "transition-all duration-150 ease-out"
        )}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {children}
        
        {/* Ripple effects */}
        {ripple && ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
              animationDuration: '0.6s',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards'
            }}
          />
        ))}
      </Comp>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, enhancedButtonVariants }
