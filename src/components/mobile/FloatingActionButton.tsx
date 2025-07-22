
import React, { useState } from 'react';
import { Plus, X, Edit, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import EnhancedButton from './EnhancedButton';
import { useDraggable } from '@/hooks/useDraggable';

interface FABAction {
  icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  onCreateTask: () => void;
  onStartTimer?: () => void;
  onQuickNote?: () => void;
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onCreateTask,
  onStartTimer,
  onQuickNote,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Initialize draggable with default position (bottom-right)
  const { dragRef, position, isDragging, hasMoved, dragHandlers } = useDraggable({
    x: window.innerWidth - 80, // 80px from right (56px FAB + 24px margin)
    y: window.innerHeight - 120 // 120px from bottom (56px FAB + 64px margin for bottom nav)
  });

  const actions: FABAction[] = [
    {
      icon: Edit,
      label: 'Create Task',
      onClick: () => {
        if (hasMoved) return; // Prevent action if dragging
        onCreateTask();
        setIsExpanded(false);
      },
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    ...(onStartTimer ? [{
      icon: Clock,
      label: 'Start Timer',
      onClick: () => {
        if (hasMoved) return; // Prevent action if dragging
        onStartTimer();
        setIsExpanded(false);
      },
      color: 'bg-green-500 hover:bg-green-600'
    }] : []),
    ...(onQuickNote ? [{
      icon: Users,
      label: 'Quick Note',
      onClick: () => {
        if (hasMoved) return; // Prevent action if dragging
        onQuickNote();
        setIsExpanded(false);
      },
      color: 'bg-purple-500 hover:bg-purple-600'
    }] : [])
  ];

  const handleMainFABClick = () => {
    if (hasMoved) return; // Prevent expand/collapse if dragging
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      ref={dragRef}
      className={cn(
        "fixed z-[70] flex flex-col-reverse items-end gap-3",
        "touch-none select-none", // Prevent text selection during drag
        isDragging && "transition-none", // Disable transitions while dragging
        !isDragging && "transition-all duration-200", // Smooth transitions when not dragging
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        left: 0,
        top: 0,
      }}
    >
      {/* Action buttons */}
      {isExpanded && actions.map((action, index) => (
        <div
          key={action.label}
          className="flex items-center gap-3 animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-full px-3 py-1 shadow-lg">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {action.label}
            </span>
          </div>
          <EnhancedButton
            size="icon"
            className={cn(
              "w-12 h-12 rounded-full shadow-lg border-0",
              "transition-all duration-200 hover:scale-110 active:scale-95",
              action.color || "bg-primary hover:bg-primary/90"
            )}
            onClick={action.onClick}
          >
            <action.icon className="h-5 w-5 text-white" />
          </EnhancedButton>
        </div>
      ))}

      {/* Main FAB */}
      <EnhancedButton
        size="icon"
        className={cn(
          "w-14 h-14 rounded-full shadow-xl border-0",
          "bg-primary hover:bg-primary/90",
          "transition-all duration-300 active:scale-95 cursor-move",
          isExpanded ? "rotate-45 scale-110" : "rotate-0 scale-100",
          isDragging && "scale-110 shadow-2xl", // Visual feedback while dragging
          isDragging && "opacity-90" // Slight transparency while dragging
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

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton;
