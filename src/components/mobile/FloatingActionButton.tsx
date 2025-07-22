
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Edit, Clock, FolderPlus, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { useDraggable } from '@/hooks/useDraggable';

interface FABAction {
  icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  onCreateTask: () => void;
  onCreateProject?: () => void;
  onStartTimer?: () => void;
  onQuickNote?: () => void;
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onCreateTask,
  onCreateProject,
  onStartTimer,
  onQuickNote,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [defaultPosition, setDefaultPosition] = useState({ x: 0, y: 0 });
  
  // Calculate and set default position
  useEffect(() => {
    const calculatePosition = () => {
      const fabSize = 56; // 14 * 4px (w-14 h-14)
      const margin = 24;
      const bottomNavHeight = 80; // Approximate bottom navigation height
      
      const defaultX = window.innerWidth - fabSize - margin;
      const defaultY = window.innerHeight - fabSize - margin - bottomNavHeight;
      
      setDefaultPosition({ x: defaultX, y: defaultY });
      setIsInitialized(true);
    };

    calculatePosition();
    
    // Recalculate on window resize
    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize draggable with calculated position
  const { dragRef, position, isDragging, hasMoved, dragHandlers } = useDraggable({
    x: defaultPosition.x,
    y: defaultPosition.y,
    threshold: 10,
    onDragStart: () => {
      // Close expanded state when starting to drag
      if (isExpanded) {
        setIsExpanded(false);
      }
    }
  });

  // Haptic feedback function
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch (error) {
        // Silently fail if vibration is not supported
      }
    }
  }, []);

  // Memoized actions to prevent unnecessary re-renders
  const actions = useMemo<FABAction[]>(() => [
    {
      icon: Edit,
      label: 'Create Task',
      onClick: () => {
        if (hasMoved) return;
        triggerHaptic();
        onCreateTask();
        setIsExpanded(false);
      },
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    ...(onCreateProject ? [{
      icon: FolderPlus,
      label: 'Create Project',
      onClick: () => {
        if (hasMoved) return;
        triggerHaptic();
        onCreateProject();
        setIsExpanded(false);
      },
      color: 'bg-emerald-500 hover:bg-emerald-600'
    }] : []),
    ...(onStartTimer ? [{
      icon: Clock,
      label: 'Start Timer',
      onClick: () => {
        if (hasMoved) return;
        triggerHaptic();
        onStartTimer();
        setIsExpanded(false);
      },
      color: 'bg-green-500 hover:bg-green-600'
    }] : []),
    ...(onQuickNote ? [{
      icon: StickyNote,
      label: 'Quick Note',
      onClick: () => {
        if (hasMoved) return;
        triggerHaptic();
        onQuickNote();
        setIsExpanded(false);
      },
      color: 'bg-purple-500 hover:bg-purple-600'
    }] : [])
  ], [onCreateTask, onCreateProject, onStartTimer, onQuickNote, hasMoved, triggerHaptic]);

  const handleMainFABClick = useCallback(() => {
    if (hasMoved || isDragging) return;
    triggerHaptic();
    setIsExpanded(!isExpanded);
  }, [hasMoved, isDragging, isExpanded, triggerHaptic]);

  const handleBackdropClick = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // Don't render until position is calculated
  if (!isInitialized) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity duration-200"
          onClick={handleBackdropClick}
        />
      )}

      <div 
        ref={dragRef}
        className={cn(
          "fixed z-[70] flex flex-col-reverse items-end gap-3",
          "touch-none select-none",
          isDragging && "transition-none cursor-grabbing",
          !isDragging && "transition-all duration-200 cursor-grab",
          className
        )}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          left: 0,
          top: 0,
        }}
      >
        {/* Action buttons */}
        {isExpanded && (
          <div className="flex flex-col-reverse items-end gap-3">
            {actions.map((action, index) => (
              <div
                key={action.label}
                className="flex items-center gap-3 animate-fade-in"
                style={{ 
                  animationDelay: `${index * 75}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-full px-3 py-1.5 shadow-lg">
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    {action.label}
                  </span>
                </div>
                <EnhancedButton
                  size="icon"
                  ripple={true}
                  haptic={false} // We handle haptic ourselves
                  className={cn(
                    "w-12 h-12 rounded-full shadow-lg border-0",
                    "transition-all duration-200 hover:scale-110 active:scale-95",
                    "transform-gpu will-change-transform",
                    action.color || "bg-primary hover:bg-primary/90"
                  )}
                  onClick={action.onClick}
                >
                  <action.icon className="h-5 w-5 text-white" />
                </EnhancedButton>
              </div>
            ))}
          </div>
        )}

        {/* Main FAB */}
        <EnhancedButton
          size="icon"
          ripple={false} // Disable ripple to prevent grey box
          haptic={false} // We handle haptic ourselves
          className={cn(
            "w-14 h-14 rounded-full shadow-xl border-0",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-all duration-300 active:scale-95",
            "transform-gpu will-change-transform",
            isExpanded ? "rotate-45 scale-110" : "rotate-0 scale-100",
            isDragging && "scale-110 shadow-2xl cursor-grabbing opacity-90",
            !isDragging && !isExpanded && "hover:scale-105",
            !isDragging && "cursor-grab"
          )}
          onClick={handleMainFABClick}
          {...dragHandlers}
        >
          {isExpanded ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </EnhancedButton>
      </div>
    </>
  );
};

export default FloatingActionButton;
