import { cn } from "@/lib/utils"
import React from "react"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer' | 'pulse'
  lines?: 1 | 2 | 3 | 4
}

function Skeleton({
  className,
  variant = 'shimmer',
  lines = 1,
  ...props
}: SkeletonProps) {
  const skeletonClasses = cn(
    "rounded-md bg-muted",
    {
      "animate-pulse": variant === 'pulse',
      "animate-shimmer": variant === 'shimmer',
      "animate-pulse animate-shimmer": variant === 'default',
    },
    className
  )

  if (lines === 1) {
    return <div className={skeletonClasses} {...props} />
  }

  return (
    <div className="space-y-2" {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            skeletonClasses,
            index === lines - 1 && lines > 1 && "w-4/5", // Last line shorter
            "h-4"
          )}
        />
      ))}
    </div>
  )
}

// Enhanced skeleton components for specific use cases
export const TeamMemberSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-4 space-y-4 animate-fade-in">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" variant="shimmer" />
          <Skeleton className="h-3 w-24" variant="shimmer" />
          <Skeleton className="h-3 w-20" variant="shimmer" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
        <Skeleton className="h-5 w-5 rounded" variant="shimmer" />
      </div>
    </div>
  </div>
)

export const TeamAnalyticsSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-5 rounded" variant="shimmer" />
            <Skeleton className="h-4 w-4 rounded" variant="shimmer" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" variant="shimmer" />
            <Skeleton className="h-3 w-20" variant="shimmer" />
          </div>
        </div>
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-32" variant="shimmer" />
        <Skeleton className="h-64 w-full rounded" variant="shimmer" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <Skeleton className="h-6 w-32" variant="shimmer" />
        <Skeleton className="h-64 w-full rounded" variant="shimmer" />
      </div>
    </div>
  </div>
)

export const ProjectListSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" variant="shimmer" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" variant="shimmer" />
                <Skeleton className="h-3 w-32" variant="shimmer" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" variant="shimmer" />
              <Skeleton className="h-4 w-16" variant="shimmer" />
              <Skeleton className="h-5 w-20 rounded-full" variant="shimmer" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" variant="shimmer" />
        </div>
        <Skeleton lines={2} variant="shimmer" />
      </div>
    ))}
  </div>
)

export { Skeleton }