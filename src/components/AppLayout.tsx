
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatbotBubble from './chat/ChatbotBubble';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

const AppLayout = () => {
  const { user, loading } = useAuth();

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
      <div className="min-h-screen bg-background w-full flex">
        <Sidebar />
        
        <SidebarInset className="flex flex-col flex-1">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-3 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>

        <ChatbotBubble />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
