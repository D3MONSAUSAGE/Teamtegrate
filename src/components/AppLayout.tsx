
import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const SIDEBAR_WIDTH = 256; // Tailwind w-64

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
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar with Sheet component */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onNavigation={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
      
      {/* Desktop sidebar - fixed and not scrollable */}
      <div
        className="hidden md:block"
        aria-hidden={isMobile ? "true" : "false"}
      >
        <div
          className="fixed top-0 left-0 h-screen w-64 z-30"
          style={{ height: '100vh', width: SIDEBAR_WIDTH }}
        >
          <Sidebar />
        </div>
      </div>
      
      {/* Main content area (with sidebar offset on desktop) */}
      <div
        className={`flex flex-col flex-1 overflow-hidden`}
        style={{
          marginLeft: !isMobile ? SIDEBAR_WIDTH : 0,
        }}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
