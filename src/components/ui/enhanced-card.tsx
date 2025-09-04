import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground shadow transition-all duration-200 mobile-optimized",
  {
    variants: {
      variant: {
        default: "hover:shadow-md",
        interactive: "hover:shadow-lg hover:scale-[1.01] cursor-pointer active:scale-[0.99] hover:bg-card/80",
        elevated: "shadow-lg hover:shadow-xl hover:-translate-y-1",
        glass: "backdrop-blur-sm bg-card/80 border-border/50",
        gradient: "bg-gradient-to-br from-card to-card/80 border-border/50",
      },
      padding: {
        none: "",
        sm: "p-3",
        default: "p-6",
        lg: "p-8",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1",
        glow: "hover:shadow-lg hover:shadow-primary/10",
        scale: "hover:scale-[1.02]",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      hover: "none",
    },
  }
)

interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  loading?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, loading, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, padding, hover }),
        loading && "animate-pulse",
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="animate-shimmer bg-muted h-full min-h-[100px] rounded" />
      ) : (
        children
      )}
    </div>
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      compact ? "pb-3" : "p-6 pb-0",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { 
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    gradient?: boolean
  }
>(({ className, children, as: Component = 'h3', gradient, ...props }, ref) => {
  const titleClasses = cn(
    "font-semibold leading-none tracking-tight",
    gradient && "bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent",
    className
  )
  
  return (
    <Component
      ref={ref}
      className={titleClasses}
      {...props}
    >
      {children}
    </Component>
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { muted?: boolean }
>(({ className, muted = true, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-relaxed",
      muted && "text-muted-foreground",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      compact ? "pt-3" : "p-6 pt-0", 
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }
>(({ className, compact, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center",
      compact ? "pt-3" : "p-6 pt-0",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants 
}