import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Upload, 
  BarChart3, 
  FileText,
  Plus,
  Users,
  Settings,
  Store,
  Receipt
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

// Tab Components
import FinanceDashboardTab from '@/components/finance/tabs/FinanceDashboardTab';
import WeeklyReportsTab from '@/components/finance/tabs/WeeklyReportsTab';
import AdvancedReportsTab from '@/components/finance/tabs/AdvancedReportsTab';
import UploadCenterTab from '@/components/finance/tabs/UploadCenterTab';
import { SalesChannelsManager } from '@/components/finance/sales-channels/SalesChannelsManager';
import InvoiceManager from '@/components/finance/InvoiceManager';
import { InvoiceBuilder } from '@/components/finance/invoices/InvoiceBuilder';
import { ClientsManager } from '@/components/finance/clients/ClientsManager';
import { PaymentSettings } from '@/components/finance/settings/PaymentSettings';
import PayrollTab from '@/components/finance/tabs/PayrollTab';

type FinanceTab = 
  | 'dashboard' 
  | 'daily-sales' 
  | 'advanced-reports' 
  | 'upload' 
  | 'sales-channels'
  | 'invoices'
  | 'clients'
  | 'payment-settings'
  | 'payroll';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');
  const { user } = useAuth();
  
  const canManageData = hasRoleAccess(user?.role, 'manager');
  const isAdmin = hasRoleAccess(user?.role, 'admin');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Management</h1>
          <p className="text-muted-foreground">
            Comprehensive financial operations, sales analytics, and invoice management
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FinanceTab)}>
        <TabsList className="flex flex-wrap h-auto gap-2 bg-muted p-2 rounded-lg">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="daily-sales" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Daily Sales</span>
          </TabsTrigger>
          <TabsTrigger value="advanced-reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Advanced Reports</span>
          </TabsTrigger>
          <TabsTrigger value="sales-channels" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span>Sales Channels</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Upload Data</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span>Invoices</span>
          </TabsTrigger>
          {canManageData && (
            <>
              <TabsTrigger value="payroll" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Payroll</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Clients</span>
              </TabsTrigger>
            </>
          )}
          {isAdmin && (
            <TabsTrigger value="payment-settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Payment Settings</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <FinanceDashboardTab />
        </TabsContent>

        <TabsContent value="daily-sales" className="space-y-6 mt-6">
          <WeeklyReportsTab />
        </TabsContent>

        <TabsContent value="advanced-reports" className="space-y-6 mt-6">
          <AdvancedReportsTab />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6 mt-6">
          <UploadCenterTab />
        </TabsContent>

        <TabsContent value="sales-channels" className="space-y-6 mt-6">
          <SalesChannelsManager />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6 mt-6">
          <InvoiceManager />
        </TabsContent>

        {canManageData && (
          <>
            <TabsContent value="payroll" className="space-y-6 mt-6">
              <PayrollTab />
            </TabsContent>
            
            <TabsContent value="clients" className="space-y-6 mt-6">
              <ClientsManager />
            </TabsContent>
          </>
        )}

        {isAdmin && (
          <TabsContent value="payment-settings" className="space-y-6 mt-6">
            <PaymentSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}