
import React from 'react';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TaskProvider } from '@/contexts/task';

const AppLayout: React.FC = () => {
  // All app content inside AppLayout is protected and now has tooltip support
  return (
    <ProtectedRoute>
      <TooltipProvider>
        <TaskProvider>
          <div className="min-h-screen">
            <Outlet />
          </div>
        </TaskProvider>
      </TooltipProvider>
    </ProtectedRoute>
  );
};

export default AppLayout;

