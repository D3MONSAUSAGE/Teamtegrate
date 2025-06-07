
import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatbotBubble from './chat/ChatbotBubble';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './ui/sidebar';

const AppLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background overflow-x-hidden w-full flex">
        {/* Mobile sidebar with Sheet component */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 max-h-[100dvh] overflow-y-auto">
            <Sidebar onNavigation={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Desktop collapsible sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Main content area */}
        <SidebarInset className="flex flex-col flex-1 overflow-x-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-3 md:p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </SidebarInset>

        {/* Chatbot Bubble */}
        <ChatbotBubble />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
