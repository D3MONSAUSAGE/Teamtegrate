
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatbotBubble from './chat/ChatbotBubble';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

const AppLayout = () => {
  const { user, loading } = useAuth();

  console.log('AppLayout - Loading:', loading, 'User:', !!user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('AppLayout: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full flex mobile-safe-area">
        <Sidebar />
        
        <SidebarInset className="flex flex-col flex-1">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-3 md:p-6 no-bounce">
            <Outlet />
          </main>
        </SidebarInset>

        <ChatbotBubble />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
