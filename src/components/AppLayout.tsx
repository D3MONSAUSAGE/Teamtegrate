
import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

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
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar with Sheet component */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          {/* Hamburger is always fixed at top left on mobile */}
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed top-0 left-0 z-[100] md:hidden bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md rounded-none h-14 w-14"
            style={{ borderRadius: 0 }}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onNavigation={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar - fixed and not scrollable */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <div className="fixed left-0 top-0 h-screen w-64 z-40">
          <Sidebar />
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Padding left to avoid content under sidebar on desktop */}
        <Navbar />
        <main
          className="flex-1 overflow-y-auto p-3 md:p-6"
          style={{ paddingLeft: isMobile ? undefined : 0 }}
        >
          {/* Add margin-left for main area on desktop so content doesn't go under sidebar */}
          <div className="md:ml-64">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
