import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { useEmployeeActions } from '@/hooks/employeeActions/useEmployeeActions';
import ModernPageHeader from '@/components/ui/ModernPageHeader';
import { Users, UserPlus, DollarSign, Briefcase, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmployeeListView from '@/components/hr/EmployeeListView';
import EmployeeProfileDialog from '@/components/hr/EmployeeProfileDialog';
import PayrollOverview from '@/components/hr/PayrollOverview';
import CreateEmployeeWizard from '@/components/hr/wizard/CreateEmployeeWizard';
import EmployeeRecordsTab from '@/components/hr/EmployeeRecordsTab';
import { RecruitmentDashboard } from '@/pages/RecruitmentDashboard';
import { CreateActionDialog } from '@/components/employee-actions/CreateActionDialog';
import { ActionStatsCards } from '@/components/employee-actions/ActionStatsCards';
import { ActionsList } from '@/components/employee-actions/ActionsList';
import { User } from '@/types';

const HRManagementPage = () => {
  const { user } = useAuth();
  const { users, isLoading, refetchUsers } = useEnhancedUserManagement();
  const { actions, myActions, stats, isLoading: actionsLoading } = useEmployeeActions();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [isCreateActionDialogOpen, setIsCreateActionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');
  const [actionsSubTab, setActionsSubTab] = useState('all');

  const handleEditEmployee = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedUserId(null);
    setIsProfileDialogOpen(false);
    refetchUsers();
  };

  // Filter to active employees only by default
  const activeEmployees = users.filter(u => {
    // @ts-ignore - employment_status is being added
    return !u.employment_status || u.employment_status === 'active';
  });

  // Check if user can manage actions (create, update)
  const canManageActions = user?.role && ['superadmin', 'admin', 'manager', 'team_leader'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <ModernPageHeader
          title="HR Management"
          subtitle="Manage employee records, pay rates, and HR information"
          icon={Users}
          stats={[
            { label: 'Active Employees', value: activeEmployees.length, color: 'text-primary' },
            { label: 'Total Records', value: users.length, color: 'text-muted-foreground' },
          ]}
        />
        <div className="flex gap-2">
          {canManageActions && activeTab === 'actions' && (
            <Button onClick={() => setIsCreateActionDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Action
            </Button>
          )}
          <Button onClick={() => setIsCreateWizardOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      <ScrollableTabs className="space-y-4">
        <ScrollableTabsList>
          <ScrollableTabsTrigger
            isActive={activeTab === 'employees'}
            onClick={() => setActiveTab('employees')}
          >
            <Users className="h-4 w-4 mr-2" />
            Employees
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger
            isActive={activeTab === 'records'}
            onClick={() => setActiveTab('records')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Records
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger
            isActive={activeTab === 'actions'}
            onClick={() => setActiveTab('actions')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Employee Actions ({stats.total_actions || 0})
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger
            isActive={activeTab === 'recruitment'}
            onClick={() => setActiveTab('recruitment')}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Recruitment
          </ScrollableTabsTrigger>
          <ScrollableTabsTrigger
            isActive={activeTab === 'payroll'}
            onClick={() => setActiveTab('payroll')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Payroll
          </ScrollableTabsTrigger>
        </ScrollableTabsList>

        {activeTab === 'employees' && (
          <div className="space-y-4">
            <EmployeeListView
              employees={users}
              isLoading={isLoading}
              onEditEmployee={handleEditEmployee}
            />
          </div>
        )}

        {activeTab === 'records' && (
          <div className="space-y-4">
            <EmployeeRecordsTab />
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-4">
            <ActionStatsCards stats={stats} />
            
            <Tabs value={actionsSubTab} onValueChange={setActionsSubTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                {canManageActions && (
                  <TabsTrigger value="all">
                    All Actions ({stats.total_actions || 0})
                  </TabsTrigger>
                )}
                <TabsTrigger value="my-actions">
                  My Actions ({myActions.length})
                </TabsTrigger>
              </TabsList>

              {canManageActions && (
                <TabsContent value="all" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Employee Actions</CardTitle>
                      <CardDescription>
                        View and manage all employee actions in your organization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {actionsLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading actions...</div>
                      ) : (
                        <ActionsList 
                          actions={actions} 
                          canManage={true}
                          showRecipient={true}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="my-actions" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>My Actions</CardTitle>
                    <CardDescription>
                      View actions that have been issued to you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {actionsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading actions...</div>
                    ) : (
                      <ActionsList 
                        actions={myActions} 
                        canManage={false}
                        showRecipient={false}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {activeTab === 'recruitment' && (
          <div className="space-y-4">
            <RecruitmentDashboard />
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <PayrollOverview employees={activeEmployees} />
          </div>
        )}
      </ScrollableTabs>

      <CreateEmployeeWizard
        open={isCreateWizardOpen}
        onOpenChange={setIsCreateWizardOpen}
        onSuccess={refetchUsers}
      />

      <EmployeeProfileDialog
        userId={selectedUserId}
        open={isProfileDialogOpen}
        onOpenChange={handleCloseDialog}
      />

      {canManageActions && (
        <CreateActionDialog 
          open={isCreateActionDialogOpen}
          onOpenChange={setIsCreateActionDialogOpen}
        />
      )}
    </div>
  );
};

export default HRManagementPage;
