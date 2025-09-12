import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ScheduleManagerDashboard from '@/components/schedule/ScheduleManagerDashboard';
import ScheduleEmployeeDashboard from '@/components/schedule/ScheduleEmployeeDashboard';

const SchedulePage: React.FC = () => {
  const { hasRoleAccess } = useAuth();

  // Show manager dashboard for managers and admins, employee dashboard for regular users
  if (hasRoleAccess('manager')) {
    return <ScheduleManagerDashboard />;
  }

  return <ScheduleEmployeeDashboard />;
};

export default SchedulePage;