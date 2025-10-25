import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import ModernPageHeader from '@/components/ui/ModernPageHeader';
import { Users, UserPlus, DollarSign, Briefcase, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
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
  const [activeTab, setActiveTab] = useState('employees');

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
    </div>
  );
};

export default HRManagementPage;
