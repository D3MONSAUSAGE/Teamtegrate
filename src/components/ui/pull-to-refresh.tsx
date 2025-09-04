import React, { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { RefreshCw, ChevronDown } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  className?: string
  threshold?: number
  disabled?: boolean
  pullDistance?: number
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  threshold = 100,
  disabled = false,
  pullDistance = 150
}) => {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDist, setPullDist] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const container = containerRef.current
    if (!container) return
    
    // Only start pull-to-refresh if we're at the top
    if (container.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    
    if (diff > 0) {
      // Prevent default scrolling behavior
      e.preventDefault()
      
      // Calculate pull distance with resistance
      const resistance = 0.5
      const calculatedDist = Math.min(diff * resistance, pullDistance)
      
      setPullDist(calculatedDist)
      setCanRefresh(calculatedDist >= threshold)
    }
  }, [isPulling, disabled, isRefreshing, threshold, pullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return
    
    setIsPulling(false)
    
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true)
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDist(0)
        setCanRefresh(false)
      }
    } else {
      // Animate back to 0
      setPullDist(0)
      setCanRefresh(false)
    }
  }, [isPulling, disabled, canRefresh, isRefreshing, onRefresh])

  const progress = Math.min((pullDist / threshold) * 100, 100)
  const showIndicator = isPulling || isRefreshing
  const indicatorOpacity = showIndicator ? Math.min(pullDist / 50, 1) : 0

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-auto h-full mobile-optimized",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isPulling || isRefreshing ? `translateY(${pullDist}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex flex-col items-center justify-center z-10 bg-background/80 backdrop-blur-sm border-b border-border/50",
          "transition-all duration-300"
        )}
        style={{
          height: showIndicator ? '80px' : '0px',
          opacity: indicatorOpacity,
          transform: `translateY(-80px)`,
        }}
      >
        <div className="flex flex-col items-center gap-2 p-4">
          {isRefreshing ? (
            <>
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">
                Refreshing...
              </span>
            </>
          ) : (
            <>
              <div className="relative">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full border-2 border-muted-foreground/30 transition-all duration-150",
                    canRefresh && "border-primary"
                  )}
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-150"
                    style={{
                      width: `${progress}%`,
                      opacity: progress / 100,
                    }}
                  />
                </div>
                <ChevronDown
                  className={cn(
                    "absolute inset-0 h-6 w-6 transition-all duration-150",
                    canRefresh ? "text-primary rotate-180" : "text-muted-foreground"
                  )}
                />
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                {canRefresh ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}

export default PullToRefresh