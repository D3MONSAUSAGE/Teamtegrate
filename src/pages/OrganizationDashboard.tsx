
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import OrganizationHeader from '@/components/organization/OrganizationHeader';
import OrganizationStatsCards from '@/components/organization/OrganizationStatsCards';
import UserRoleManagement from '@/components/organization/UserRoleManagement';
import SuperadminUserManagement from '@/components/organization/SuperadminUserManagement';
import RoleDistributionChart from '@/components/organization/RoleDistributionChart';
import OrganizationQuickActions from '@/components/organization/OrganizationQuickActions';

const OrganizationDashboard = () => {
  const { user, loading } = useAuth();

  console.log('OrganizationDashboard - User:', user);
  console.log('OrganizationDashboard - Loading:', loading);

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading organization dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user exists
  if (!user) {
    console.log('OrganizationDashboard - No user found');
    return (
      <div className="p-6 text-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the organization dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if user has permission to access organization dashboard
  const hasOrganizationAccess = ['superadmin', 'admin', 'manager'].includes(user.role);
  
  console.log('OrganizationDashboard - User role:', user.role);
  console.log('OrganizationDashboard - Has access:', hasOrganizationAccess);

  if (!hasOrganizationAccess) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access the organization dashboard. 
            Contact your administrator for access. Your current role is: {user.role}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log('OrganizationDashboard - Rendering dashboard components');

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
          {user.role === 'superadmin' ? (
            <SuperadminUserManagement />
          ) : (
            <UserRoleManagement />
          )}
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
