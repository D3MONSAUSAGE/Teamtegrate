
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileDialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  variant?: 'fullscreen' | 'bottom-sheet' | 'centered';
  className?: string;
}

const MobileDialogWrapper: React.FC<MobileDialogWrapperProps> = ({
  open,
  onOpenChange,
  children,
  title,
  subtitle,
  showCloseButton = true,
  variant = 'bottom-sheet',
  className
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTimeout(() => setIsAnimating(false), 300);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const getContentStyles = () => {
    switch (variant) {
      case 'fullscreen':
        return "fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 m-0 rounded-none max-w-none h-screen w-screen";
      case 'bottom-sheet':
        return "fixed bottom-0 left-0 right-0 top-[10vh] z-50 bg-background/98 backdrop-blur-xl border-t border-border/50 rounded-t-3xl shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=closed]:duration-300 data-[state=open]:duration-500 overflow-hidden";
      case 'centered':
        return "fixed left-[50%] top-[50%] z-50 grid w-[95vw] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background/98 backdrop-blur-xl p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className={cn(getContentStyles(), className)}>
        {/* Handle for bottom sheet */}
        {variant === 'bottom-sheet' && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-border/50">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-xl font-bold text-foreground line-clamp-2">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="ml-4 h-8 w-8 p-0 rounded-full hover:bg-muted/80"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileDialogWrapper;
