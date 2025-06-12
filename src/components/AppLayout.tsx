
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatbotBubble from './chat/ChatbotBubble';
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const { setOpen, isMobile } = useSidebar();
  const isDesktop = !isMobile;

  const handleMainContentClick = () => {
    // Only auto-collapse on desktop, not mobile
    if (isDesktop) {
      setOpen(false);
    }
  };

  return (
    <SidebarInset 
      className="flex flex-col flex-1 no-scrollbar overflow-hidden"
      onClick={handleMainContentClick}
    >
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar smooth-scroll">
        <div className="p-3 md:p-6 space-y-6 animate-fade-in">
          {children}
        </div>
      </main>
    </SidebarInset>
  );
};

const AppLayout = () => {
  const { user, isAuthenticated } = useAuth();

  console.log('AppLayout - User:', !!user, 'IsAuthenticated:', isAuthenticated);

  // Note: Auth check is now handled by ProtectedRoute wrapper
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background w-full flex mobile-safe-area no-scrollbar overflow-hidden">
        <Sidebar />
        
        <MainContent>
          <Outlet />
        </MainContent>

        <ChatbotBubble />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
