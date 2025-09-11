import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Upload, 
  BarChart3, 
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

// Tab Components
import FinanceDashboardTab from '@/components/finance/tabs/FinanceDashboardTab';
import WeeklyReportsTab from '@/components/finance/tabs/WeeklyReportsTab';
import AdvancedReportsTab from '@/components/finance/tabs/AdvancedReportsTab';
import UploadCenterTab from '@/components/finance/tabs/UploadCenterTab';

type FinanceTab = 'dashboard' | 'weekly-reports' | 'advanced-reports' | 'upload';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');
  const { user } = useAuth();
  
  const canManageData = hasRoleAccess(user?.role, 'manager');
  const isAdmin = hasRoleAccess(user?.role, 'admin');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground">
            Track sales performance, upload POS data, and generate insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Quick export functionality */}}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FinanceTab)}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-fit">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="weekly-reports" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Weekly Reports</span>
          </TabsTrigger>
          <TabsTrigger value="advanced-reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced Reports</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload Center</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <FinanceDashboardTab />
        </TabsContent>

        <TabsContent value="weekly-reports" className="space-y-6 mt-6">
          <WeeklyReportsTab />
        </TabsContent>

        <TabsContent value="advanced-reports" className="space-y-6 mt-6">
          <AdvancedReportsTab />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6 mt-6">
          <UploadCenterTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}