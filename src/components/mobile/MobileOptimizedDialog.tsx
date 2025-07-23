
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileOptimizedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

const MobileOptimizedDialog: React.FC<MobileOptimizedDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showCloseButton = true,
  showBackButton = false,
  onBack
}) => {
  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton={true}
        className={cn(
        isMobile 
          ? "mobile-dialog-full flex flex-col p-0 gap-0 mobile-animate-slide-up"
          : "w-full max-w-md mx-auto h-auto max-h-[90vh] overflow-hidden",
        "rounded-xl border shadow-xl bg-background",
        className
      )}>
        {/* Mobile Header */}
        <DialogHeader className={cn(
          "border-b safe-area-top",
          isMobile ? "p-4 pb-3 flex-shrink-0" : "p-6 pb-4"
        )}>
          <div className="flex items-center gap-3">
            {isMobile && showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack || (() => onOpenChange(false))}
                className="h-8 w-8 p-0 rounded-full hover:bg-muted flex-shrink-0"
                aria-label="Go back"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div className="flex-1 min-w-0">
              <DialogTitle className={cn(
                "text-left line-clamp-1",
                isMobile ? "text-lg mobile-text-xl font-semibold" : "text-xl font-semibold"
              )}>
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className={cn(
                  "mt-1 text-muted-foreground text-left line-clamp-2",
                  isMobile ? "text-sm mobile-text-sm" : "text-sm"
                )}>
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

        {/* Content */}
        <div className={cn(
          "flex-1 overflow-y-auto mobile-scroll-y",
          isMobile ? "safe-area-bottom" : ""
        )}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileOptimizedDialog;
