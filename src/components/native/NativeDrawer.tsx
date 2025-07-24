
import React, { memo, useCallback } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import SidebarNav from '../sidebar/SidebarNav';
import SidebarFooter from '../sidebar/SidebarFooter';
import { cn } from '@/lib/utils';

interface NativeDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

const NativeDrawer: React.FC<NativeDrawerProps> = memo(({ 
  isOpen, 
  onOpenChange, 
  className 
}) => {
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();

  const handleNavigation = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const sidebarUser = user ? {
    name: user.name || user.email || 'User',
    email: user.email,
    role: user.role
  } : null;

  if (!sidebarUser) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className={cn(
          "w-80 p-0 bg-sidebar border-r border-sidebar-border/60",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <h1 className="text-lg font-semibold">TeamTegrate</h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-2">
            <SidebarNav 
              onNavigation={handleNavigation}
              isCollapsed={false}
            />
          </div>

          {/* Footer */}
          <div className="border-t border-sidebar-border/30 bg-gradient-to-t from-sidebar-background/80 to-transparent">
            <SidebarFooter 
              user={sidebarUser}
              isCollapsed={false}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

NativeDrawer.displayName = 'NativeDrawer';

export default NativeDrawer;
