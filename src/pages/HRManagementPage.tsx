import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import ModernPageHeader from '@/components/ui/ModernPageHeader';
import { Users, UserPlus, DollarSign, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmployeeListView from '@/components/hr/EmployeeListView';
import EmployeeProfileDialog from '@/components/hr/EmployeeProfileDialog';
import PayrollOverview from '@/components/hr/PayrollOverview';
import CreateEmployeeWizard from '@/components/hr/wizard/CreateEmployeeWizard';
import EmployeeRecordsTab from '@/components/hr/EmployeeRecordsTab';
import { RecruitmentDashboard } from '@/pages/RecruitmentDashboard';
import { User } from '@/types';

const HRManagementPage = () => {
  const { user } = useAuth();
  const { users, isLoading, refetchUsers } = useEnhancedUserManagement();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      <ModernPageHeader
        title="HR Management"
        subtitle="Manage employee records, pay rates, and HR information"
        icon={Users}
        actionButton={{
          label: 'Add Employee',
          onClick: () => setIsCreateWizardOpen(true),
          icon: UserPlus,
        }}
        stats={[
          { label: 'Active Employees', value: activeEmployees.length, color: 'text-primary' },
          { label: 'Total Records', value: users.length, color: 'text-muted-foreground' },
        ]}
      />

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="grid w-full max-w-4xl grid-cols-4">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="records">Employee Records</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <EmployeeListView
            employees={users}
            isLoading={isLoading}
            onEditEmployee={handleEditEmployee}
          />
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <EmployeeRecordsTab />
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-4">
          <RecruitmentDashboard />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <PayrollOverview employees={activeEmployees} />
        </TabsContent>
      </Tabs>

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
    </div>
  );
};

export default HRManagementPage;
