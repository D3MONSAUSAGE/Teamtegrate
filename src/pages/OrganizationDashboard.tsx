
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from 'lucide-react';
import OrganizationHeader from '@/components/organization/OrganizationHeader';
import OrganizationStatsCards from '@/components/organization/OrganizationStatsCards';
import UserRoleManagement from '@/components/organization/UserRoleManagement';
import RoleDistributionChart from '@/components/organization/RoleDistributionChart';
import OrganizationQuickActions from '@/components/organization/OrganizationQuickActions';

const OrganizationDashboard = () => {
  const { user } = useAuth();

  // Check if user has permission to access organization dashboard
  const hasOrganizationAccess = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please log in to access the organization dashboard.</p>
      </div>
    );
  }

  if (!hasOrganizationAccess) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the organization dashboard. 
            Contact your administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <OrganizationHeader />
      
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Organization Dashboard</h1>
      </div>

      <OrganizationStatsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserRoleManagement />
        </div>
        <div className="space-y-6">
          <RoleDistributionChart />
          <OrganizationQuickActions />
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboard;
