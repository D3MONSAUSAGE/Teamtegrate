
import React from 'react';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { TooltipProvider } from '@/components/ui/tooltip';

const AppLayout: React.FC = () => {
  // All app content inside AppLayout is protected and now has tooltip support
  return (
    <ProtectedRoute>
      <TooltipProvider>
        <div className="min-h-screen">
          <Outlet />
        </div>
      </TooltipProvider>
    </ProtectedRoute>
  );
};

export default AppLayout;

