
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimplifiedDialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

const SimplifiedDialogWrapper: React.FC<SimplifiedDialogWrapperProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showCloseButton = true
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "w-full max-w-md mx-auto",
        "h-auto max-h-[90vh] overflow-hidden",
        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "sm:w-full sm:max-w-lg",
        "flex flex-col gap-0 p-0",
        "rounded-xl border shadow-xl bg-background",
        className
      )}>
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-left line-clamp-2">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-2 text-muted-foreground text-left">
                  {description}
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 rounded-full hover:bg-muted flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplifiedDialogWrapper;
