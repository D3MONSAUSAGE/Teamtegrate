
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  variant?: 'task' | 'project' | 'compact';
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  className, 
  variant = 'task' 
}) => {
  return (
    <Card className={cn(
      "relative overflow-hidden bg-card border border-border/60",
      variant === 'task' && "min-h-[280px]",
      variant === 'project' && "min-h-[200px]",
      variant === 'compact' && "min-h-[120px]",
      className
    )}>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" 
           style={{
             backgroundSize: '200% 100%',
             animation: 'shimmer 2s infinite linear'
           }} 
      />
      
      {/* Content skeleton */}
      <div className="p-5 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-3 bg-muted/70 rounded w-3/4 animate-pulse" />
          </div>
          <div className="w-16 h-6 bg-muted rounded-full animate-pulse" />
        </div>

        {/* Description skeleton */}
        {variant !== 'compact' && (
          <div className="space-y-2">
            <div className="h-3 bg-muted/70 rounded animate-pulse" />
            <div className="h-3 bg-muted/50 rounded w-2/3 animate-pulse" />
          </div>
        )}

        {/* Metadata skeleton */}
        <div className="grid grid-cols-2 gap-2">
          <div className="h-8 bg-muted/50 rounded animate-pulse" />
          <div className="h-8 bg-muted/50 rounded animate-pulse" />
        </div>

        {/* Timer skeleton (for task variant) */}
        {variant === 'task' && (
          <div className="h-12 bg-muted/40 rounded-lg animate-pulse" />
        )}

        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="h-6 w-20 bg-muted/60 rounded animate-pulse" />
          <div className="h-6 w-16 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
};

export default SkeletonCard;
