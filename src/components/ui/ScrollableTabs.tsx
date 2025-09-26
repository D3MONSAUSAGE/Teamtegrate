import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScrollableTabsProps {
  children: React.ReactNode;
  className?: string;
}

interface ScrollableTabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface ScrollableTabsTriggerProps {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const ScrollableTabs: React.FC<ScrollableTabsProps> = ({ children, className }) => {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  );
};

export const ScrollableTabsList: React.FC<ScrollableTabsListProps> = ({ children, className }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className={cn(
        "flex w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory",
        "border border-border rounded-lg bg-muted p-1 text-muted-foreground",
        "scroll-smooth gap-1",
        className
      )}>
        {children}
      </div>
    );
  }

  // Desktop fallback - render as grid as before
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {children}
    </div>
  );
};

export const ScrollableTabsTrigger: React.FC<ScrollableTabsTriggerProps> = ({ 
  children, 
  className, 
  isActive,
  onClick 
}) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap",
          "rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background",
          "transition-all focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "min-w-0 flex-shrink-0 snap-start",
          "min-h-[44px]", // Touch-friendly minimum height
          isActive 
            ? "bg-primary/10 text-primary border border-primary/20"
            : "hover:bg-muted-foreground/10",
          className
        )}
      >
        {children}
      </button>
    );
  }

  // Desktop fallback - render as regular button
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap",
        "rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background",
        "transition-all focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? "bg-primary/10 text-primary border border-primary/20"
          : "hover:bg-muted-foreground/10",
        className
      )}
    >
      {children}
    </button>
  );
};