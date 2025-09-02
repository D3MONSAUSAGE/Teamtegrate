import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeActions } from '@/hooks/employeeActions/useEmployeeActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { CreateActionDialog } from './CreateActionDialog';
import { ActionsList } from './ActionsList';
import { ActionStatsCards } from './ActionStatsCards';

export const EmployeeActionsPage: React.FC = () => {
  const { user } = useAuth();
  const { actions, myActions, stats, isLoading } = useEmployeeActions();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Check if user can manage actions (create, update)
  const canManageActions = user?.role && ['superadmin', 'admin', 'manager', 'team_leader'].includes(user.role);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="animate-pulse bg-muted h-8 w-64 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-muted h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Employee Actions</h1>
            <p className="text-muted-foreground mt-2">
              Manage warnings and coaching actions for your organization
            </p>
          </div>
          {canManageActions && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Action
            </Button>
          )}
        </div>
      </div>

      <ActionStatsCards stats={stats} />

      <div className="mt-8">
        <Tabs defaultValue={canManageActions ? "all" : "my-actions"} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            {canManageActions && (
              <TabsTrigger value="all">
                All Actions ({stats.total_actions})
              </TabsTrigger>
            )}
            <TabsTrigger value="my-actions">
              My Actions ({myActions.length})
            </TabsTrigger>
          </TabsList>

          {canManageActions && (
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Employee Actions</CardTitle>
                  <CardDescription>
                    View and manage all employee actions in your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ActionsList 
                    actions={actions} 
                    canManage={true}
                    showRecipient={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="my-actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Actions</CardTitle>
                <CardDescription>
                  View actions that have been issued to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionsList 
                  actions={myActions} 
                  canManage={false}
                  showRecipient={false}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {canManageActions && (
        <CreateActionDialog 
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
    </div>
  );
};