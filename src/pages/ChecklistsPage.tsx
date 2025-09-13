import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { MyChecklistsTab } from '@/components/checklists/MyChecklistsTab';
import { ChecklistHistoryTab } from '@/components/checklists/ChecklistHistoryTab';
import { ChecklistManagementTab } from '@/components/checklists/ChecklistManagementTab';
import { ChecklistVerificationTab } from '@/components/checklists/ChecklistVerificationTab';
import { ClipboardList, History, Settings, ShieldCheck, BarChart3 } from 'lucide-react';
import { DailyTeamDashboard } from '@/components/checklists/DailyTeamDashboard';
import AdvancedAnalytics from '@/components/checklists/AdvancedAnalytics';
import PredictiveInsights from '@/components/checklists/PredictiveInsights';

const ChecklistsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-checklists');

  const canManage = hasRoleAccess(user?.role, 'manager');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Checklists</h1>
          <p className="text-muted-foreground">
            Manage daily tasks, track completion, and ensure quality standards
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${canManage ? 'grid-cols-7' : 'grid-cols-2'}`}>
          <TabsTrigger value="my-checklists" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            My Checklists
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          {canManage && (
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Team Dashboard
            </TabsTrigger>
          )}
          {canManage && (
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Verification
            </TabsTrigger>
          )}
          {canManage && (
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
          {canManage && (
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          )}
          {canManage && (
            <TabsTrigger value="management" className="flex items-center gap-2">
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
          <TabsContent value="dashboard" className="mt-6">
            <DailyTeamDashboard />
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="verification" className="mt-6">
            <ChecklistVerificationTab />
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="analytics" className="mt-6">
            <AdvancedAnalytics />
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="insights" className="mt-6">
            <PredictiveInsights />
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