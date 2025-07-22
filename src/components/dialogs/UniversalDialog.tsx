
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
    const baseStyles = "p-0 gap-0 border bg-background shadow-xl";
    
    switch (variant) {
      case 'sheet':
        return cn(
          baseStyles,
          "fixed bottom-0 left-0 right-0 top-[20vh] rounded-t-2xl",
          "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
          "sm:left-[50%] sm:right-auto sm:top-[50%] sm:w-full sm:max-w-lg",
          "sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl",
          "h-[80vh] sm:h-auto sm:max-h-[85vh]"
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
          "w-[95vw] max-w-lg rounded-xl",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          "data-[state=open]:fade-in data-[state=closed]:fade-out",
          "max-h-[90vh]"
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(getDialogStyles(), className)} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="px-6 py-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-left line-clamp-2 mb-1">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-muted-foreground text-left">
                  {description}
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 rounded-full hover:bg-muted/80 flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalDialog;
