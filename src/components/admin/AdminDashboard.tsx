
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Database, TestTube, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminUserManagement from '../profile/AdminUserManagement';
import RLSTestingPanel from './RLSTestingPanel';
import DataAuditPanel from './components/DataAuditPanel';
import DataMigrationStatus from './components/DataMigrationStatus';
import AdminWelcomeHeader from './components/AdminWelcomeHeader';
import AdminMetricsCards from './components/AdminMetricsCards';
import AdminQuickActions from './components/AdminQuickActions';
import { OrphanedAssignmentsCleanup } from './OrphanedAssignmentsCleanup';

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
    <motion.div 
      className="container mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Welcome Header */}
      <AdminWelcomeHeader />

      {/* Metrics Overview */}
      <AdminMetricsCards />

      {/* Quick Actions */}
      <AdminQuickActions />

      {/* Main Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="users" className="flex items-center gap-2 p-3">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 p-3">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2 p-3">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data Audit</span>
          </TabsTrigger>
          <TabsTrigger value="migration" className="flex items-center gap-2 p-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Migration</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2 p-3">
            <TestTube className="h-4 w-4" />
            <span className="hidden sm:inline">RLS Testing</span>
          </TabsTrigger>
        </TabsList>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TabsContent value="users" className="space-y-6">
            <Card className="border border-border/60 shadow-lg">
              <CardContent className="p-6">
                <AdminUserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border border-border/60 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Security Overview</h3>
                    <p className="text-muted-foreground text-sm">
                      Multi-tenant security system status and monitoring
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <div className="text-sm font-medium">RLS Enabled</div>
                          <div className="text-xs text-muted-foreground">Row Level Security Active</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <div className="text-sm font-medium">Organization Isolation</div>
                          <div className="text-xs text-muted-foreground">Data properly isolated</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                          <div className="text-sm font-medium">Role-Based Access</div>
                          <div className="text-xs text-muted-foreground">Permissions enforced</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <OrphanedAssignmentsCleanup />
            <DataAuditPanel />
          </TabsContent>

          <TabsContent value="migration" className="space-y-6">
            <DataMigrationStatus />
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <RLSTestingPanel />
          </TabsContent>
        </motion.div>
      </Tabs>
    </motion.div>
  );
};

export default AdminDashboard;
