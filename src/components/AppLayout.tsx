
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatbotBubble from './chat/ChatbotBubble';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

const AppLayout = () => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log('AppLayout - Loading:', loading, 'User:', !!user, 'IsAuthenticated:', isAuthenticated);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center glass-card p-8 rounded-2xl animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Loading TeamTegrate</h3>
          <p className="text-muted-foreground">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('AppLayout: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background w-full flex mobile-safe-area no-scrollbar overflow-hidden">
        <Sidebar />
        
        <SidebarInset className="flex flex-col flex-1 no-scrollbar overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar smooth-scroll">
            <div className="p-3 md:p-6 space-y-6 animate-fade-in">
              <Outlet />
            </div>
          </main>
        </SidebarInset>

        <ChatbotBubble />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
