import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Upload, 
  BarChart3, 
  Database, 
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

// Tab Components
import FinanceDashboardTab from '@/components/finance/tabs/FinanceDashboardTab';
import SalesSummaryTab from '@/components/finance/tabs/SalesSummaryTab';
import UploadCenterTab from '@/components/finance/tabs/UploadCenterTab';
import AnalyticsTab from '@/components/finance/tabs/AnalyticsTab';
import DataBrowserTab from '@/components/finance/tabs/DataBrowserTab';
import ReportsTab from '@/components/finance/tabs/ReportsTab';

type FinanceTab = 'dashboard' | 'sales-summary' | 'upload' | 'analytics' | 'data' | 'reports';

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
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-fit">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="sales-summary" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Sales Summary</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload Center</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data Browser</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <FinanceDashboardTab />
        </TabsContent>

        <TabsContent value="sales-summary" className="space-y-6 mt-6">
          <SalesSummaryTab />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6 mt-6">
          <UploadCenterTab />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <AnalyticsTab />
        </TabsContent>

        <TabsContent value="data" className="space-y-6 mt-6">
          <DataBrowserTab />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}