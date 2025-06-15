
import React from 'react';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';

const AppLayout: React.FC = () => {
  // All app content inside AppLayout is protected
  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Outlet />
      </div>
    </ProtectedRoute>
  );
};

export default AppLayout;
