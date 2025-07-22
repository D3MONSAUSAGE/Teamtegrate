
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:underline",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px] md:min-h-[40px]",
        sm: "h-9 rounded-md px-3 min-h-[44px] md:min-h-[36px]",
        lg: "h-11 rounded-md px-8 min-h-[48px] md:min-h-[44px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px] md:min-h-[40px] md:min-w-[40px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      // Add haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch (error) {
          // Silently fail if vibration is not supported
          console.debug('Haptic feedback not available');
        }
      }

      // Call the original onClick handler
      onClick?.(e);
    }, [onClick]);

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          "active:scale-95 transform-gpu will-change-transform",
          "shadow-sm hover:shadow-md active:shadow-sm",
          "transition-all duration-150 ease-out"
        )}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
