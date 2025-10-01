import React, { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { MyChecklistsTab } from '@/components/checklists/MyChecklistsTab';
import { ChecklistHistoryTab } from '@/components/checklists/ChecklistHistoryTab';
import { ChecklistManagementTab } from '@/components/checklists/ChecklistManagementTab';
import ChecklistTeamReportsTab from '@/components/checklists/ChecklistTeamReportsTab';
import { ClipboardList, History, Settings, BarChart3 } from 'lucide-react';

const ChecklistsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-checklists');

  const canManage = hasRoleAccess(user?.role, 'manager');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Modern Mobile Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Checklists
          </h1>
          <p className="text-sm text-muted-foreground">
            Track daily tasks and ensure quality standards
          </p>
        </div>

        <ScrollableTabs>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollableTabsList className="mb-4">
              <ScrollableTabsTrigger
                isActive={activeTab === 'my-checklists'}
                onClick={() => setActiveTab('my-checklists')}
              >
                <ClipboardList className="h-4 w-4" />
                <span>My Checklists</span>
              </ScrollableTabsTrigger>
              <ScrollableTabsTrigger
                isActive={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </ScrollableTabsTrigger>
              {canManage && (
                <ScrollableTabsTrigger
                  isActive={activeTab === 'team-reports'}
                  onClick={() => setActiveTab('team-reports')}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Reports</span>
                </ScrollableTabsTrigger>
              )}
              {canManage && (
                <ScrollableTabsTrigger
                  isActive={activeTab === 'management'}
                  onClick={() => setActiveTab('management')}
                >
                  <Settings className="h-4 w-4" />
                  <span>Management</span>
                </ScrollableTabsTrigger>
              )}
            </ScrollableTabsList>

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
        </ScrollableTabs>
      </div>
    </div>
  );
};

export default ChecklistsPage;