import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { MyChecklistsTab } from '@/components/checklists/MyChecklistsTab';
import { ChecklistHistoryTab } from '@/components/checklists/ChecklistHistoryTab';
import { ChecklistManagementTab } from '@/components/checklists/ChecklistManagementTab';
import ChecklistTeamReportsTab from '@/components/checklists/ChecklistTeamReportsTab';
import ModernChecklistHeader from '@/components/checklists/ModernChecklistHeader';
import { ClipboardList, History, Settings, BarChart3 } from 'lucide-react';

const ChecklistsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-checklists');

  const canManage = hasRoleAccess(user?.role, 'manager');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ModernChecklistHeader
        title="Checklists"
        subtitle="Manage daily tasks, track completion, and ensure quality standards"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${canManage ? 'grid-cols-4' : 'grid-cols-2'} bg-muted/50 p-1`}>
          <TabsTrigger 
            value="my-checklists" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <ClipboardList className="h-4 w-4" />
            My Checklists
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          {canManage && (
            <TabsTrigger 
              value="team-reports" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              Team Reports
            </TabsTrigger>
          )}
          {canManage && (
            <TabsTrigger 
              value="management" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Settings className="h-4 w-4" />
              Management
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-checklists" className="mt-6">
          <MyChecklistsTab />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <ChecklistHistoryTab />
        </TabsContent>

        {canManage && (
          <TabsContent value="team-reports" className="mt-6">
            <ChecklistTeamReportsTab />
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="management" className="mt-6">
            <ChecklistManagementTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ChecklistsPage;