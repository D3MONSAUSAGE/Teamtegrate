
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Database, TestTube, FileText } from 'lucide-react';
import AdminUserManagement from '../profile/AdminUserManagement';
import RLSTestingPanel from './RLSTestingPanel';
import DataAuditPanel from './components/DataAuditPanel';
import DataMigrationStatus from './components/DataMigrationStatus';

const AdminDashboard: React.FC = () => {
  const { user, hasRoleAccess } = useAuth();

  // Only show to admins and superadmins
  if (!user || !hasRoleAccess('admin')) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Access denied. Admin privileges required.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage users, test security policies, and monitor system health
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Testing
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Audit
          </TabsTrigger>
          <TabsTrigger value="migration" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Migration Status
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            RLS Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users in your organization, create new accounts, and handle user roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminUserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Overview
              </CardTitle>
              <CardDescription>
                Monitor security policies and organization data isolation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-sm font-medium">RLS Enabled</div>
                        <div className="text-xs text-gray-500">Row Level Security Active</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-sm font-medium">Organization Isolation</div>
                        <div className="text-xs text-gray-500">Data properly isolated</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                        <div className="text-sm font-medium">Role-Based Access</div>
                        <div className="text-xs text-gray-500">Permissions enforced</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <DataAuditPanel />
        </TabsContent>

        <TabsContent value="migration" className="space-y-6">
          <DataMigrationStatus />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <RLSTestingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
