import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 mobile-optimized mobile-touch-target mobile-focus touch-feedback",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary/80 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:bg-accent/80 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/60 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground active:bg-accent/80 hover:scale-[1.01] active:scale-[0.99]",
        link: 
          "text-primary underline-offset-4 hover:underline hover:text-primary/80 active:text-primary/60",
        success:
          "bg-success text-success-foreground shadow hover:bg-success/90 active:bg-success/80 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        warning:
          "bg-warning text-warning-foreground shadow hover:bg-warning/90 active:bg-warning/80 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-9 w-9",
      },
      loading: {
        true: "pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  ripple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    ripple = true,
    children,
    onClick,
    disabled,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([])
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Add ripple effect
      if (ripple && !disabled && !loading) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const rippleId = Date.now()
        
        setRipples(prev => [...prev, { id: rippleId, x, y }])
        
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== rippleId))
        }, 600)

        // Haptic feedback for mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(10)
        }
      }

      if (onClick && !disabled && !loading) {
        onClick(e)
      }
    }

    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {loading ? loadingText || children : children}
        
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }