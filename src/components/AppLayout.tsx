
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatbotBubble from './chat/ChatbotBubble';

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
    <div className="min-h-screen bg-background overflow-x-hidden w-full flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-x-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-3 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Chatbot Bubble */}
      <ChatbotBubble />
    </div>
  );
};

export default AppLayout;
