
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DarkModeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  isDark, 
  onToggle, 
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-1.5',
    lg: 'p-2'
  };

  return (
    <button
      aria-label="Toggle dark mode"
      className={cn(
        "rounded-full hover:bg-muted border border-transparent hover:border-primary/30 transition-colors duration-200",
        "focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center",
        buttonSizeClasses[size],
        className
      )}
      onClick={onToggle}
    >
      {isDark ? (
        <Moon className={cn(sizeClasses[size], "text-yellow-300")} />
      ) : (
        <Sun className={cn(sizeClasses[size], "text-yellow-400")} />
      )}
    </button>
  );
};

export default DarkModeToggle;
