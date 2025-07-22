
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'sheet' | 'modal' | 'fullscreen';
  className?: string;
  showCloseButton?: boolean;
}

const UniversalDialog: React.FC<UniversalDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = 'modal',
  className,
  showCloseButton = true
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const getDialogStyles = () => {
    // Base styles that completely override the default grid layout
    const baseStyles = "!grid-none !flex !flex-col !p-0 !gap-0 border bg-background shadow-2xl backdrop-blur-sm";
    
    switch (variant) {
      case 'sheet':
        return cn(
          baseStyles,
          "fixed bottom-0 left-0 right-0 top-[10vh] rounded-t-3xl border-t-2",
          "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
          "data-[state=open]:duration-300 data-[state=closed]:duration-200",
          "sm:left-[50%] sm:right-auto sm:top-[50%] sm:w-full sm:max-w-2xl",
          "sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-3xl",
          "max-h-[90vh] w-full"
        );
      case 'fullscreen':
        return cn(
          baseStyles,
          "fixed inset-0 rounded-none h-screen w-screen max-w-none",
          "data-[state=open]:fade-in data-[state=closed]:fade-out"
        );
      case 'modal':
      default:
        return cn(
          baseStyles,
          "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
          "w-[98vw] max-w-2xl rounded-3xl",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          "data-[state=open]:fade-in data-[state=closed]:fade-out",
          "data-[state=open]:duration-300 data-[state=closed]:duration-200",
          "max-h-[90vh] min-h-[300px]"
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(getDialogStyles(), className)} 
        onPointerDownOutside={(e) => e.preventDefault()}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-6 border-b border-border/30 flex-shrink-0 bg-muted/20 rounded-t-3xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-left line-clamp-2 mb-2">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-muted-foreground text-left text-base">
                  {description}
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-10 w-10 p-0 rounded-full hover:bg-muted/80 flex-shrink-0 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden universal-dialog-scroll"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>

        {/* Global styles for hiding scrollbar */}
        <style>{`
          .universal-dialog-scroll::-webkit-scrollbar {
            display: none;
          }
          .universal-dialog-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalDialog;
