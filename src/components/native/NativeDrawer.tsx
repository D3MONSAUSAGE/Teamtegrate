
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
          "w-80 p-0 bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border/40 shadow-2xl",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Header with better visual hierarchy */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border/40 bg-gradient-to-r from-sidebar-background to-sidebar-background/80">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-lg">T</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">TeamTegrate</h1>
                <p className="text-xs text-sidebar-foreground/60 font-medium">Mobile Workspace</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 rounded-xl hover:bg-sidebar-accent/50 active:scale-95 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Enhanced Navigation with better spacing */}
          <div className="flex-1 overflow-y-auto px-4 py-6 native-scroll">
            <SidebarNav 
              onNavigation={handleNavigation}
              isCollapsed={false}
            />
          </div>

          {/* Enhanced Footer with improved visual design */}
          <div className="border-t border-sidebar-border/40 bg-gradient-to-t from-sidebar-background/90 to-transparent backdrop-blur-sm">
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
