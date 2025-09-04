import React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const progressVariants = cva(
  "relative overflow-hidden rounded-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-secondary",
        success: "bg-success/20",
        warning: "bg-warning/20", 
        destructive: "bg-destructive/20",
      },
      size: {
        sm: "h-2",
        default: "h-3",
        lg: "h-4",
        xl: "h-6",
      },
      animated: {
        true: "",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animated: true,
    },
  }
)

const progressBarVariants = cva(
  "h-full rounded-full transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
      },
      animated: {
        true: "animate-progress-draw",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      animated: true,
    },
  }
)

interface ProgressProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number
  max?: number
  label?: string
  showValue?: boolean
  indeterminate?: boolean
}

const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className, 
    variant, 
    size, 
    animated, 
    value = 0, 
    max = 100, 
    label,
    showValue = false,
    indeterminate = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    return (
      <div className="space-y-2">
        {(label || showValue) && (
          <div className="flex justify-between items-center text-sm">
            {label && <span className="font-medium">{label}</span>}
            {showValue && !indeterminate && (
              <span className="text-muted-foreground">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(progressVariants({ variant, size, animated }), className)}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          {...props}
        >
          {indeterminate ? (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
          ) : (
            <div
              className={cn(progressBarVariants({ variant, animated }))}
              style={{ 
                width: `${percentage}%`,
                '--progress-offset': `${100 - percentage}%`
              } as React.CSSProperties}
            />
          )}
        </div>
      </div>
    )
  }
)
ProgressIndicator.displayName = "ProgressIndicator"

// Circular Progress Component
interface CircularProgressProps {
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  value?: number
  max?: number
  size?: number
  strokeWidth?: number
  label?: string
  showValue?: boolean
  className?: string
  indeterminate?: boolean
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  variant = "default",
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  label,
  showValue = false,
  className,
  indeterminate = false,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = indeterminate ? 0 : circumference - (percentage / 100) * circumference

  const colorClasses = {
    default: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    destructive: 'stroke-destructive',
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-500 ease-out progress-ring",
            colorClasses[variant || 'default'],
            indeterminate && "animate-spin"
          )}
          style={{
            '--progress-offset': `${strokeDashoffset}px`
          } as React.CSSProperties}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && !indeterminate && (
          <span className="text-2xl font-bold">
            {Math.round(percentage)}%
          </span>
        )}
        {label && (
          <span className="text-sm text-muted-foreground mt-1">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export { ProgressIndicator, CircularProgress }