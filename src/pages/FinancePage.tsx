import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Upload, 
  BarChart3, 
  FileText,
  Plus,
  Users,
  Settings,
  ExternalLink,
  Store
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

// Tab Components
import FinanceDashboardTab from '@/components/finance/tabs/FinanceDashboardTab';
import WeeklyReportsTab from '@/components/finance/tabs/WeeklyReportsTab';
import AdvancedReportsTab from '@/components/finance/tabs/AdvancedReportsTab';
import UploadCenterTab from '@/components/finance/tabs/UploadCenterTab';
import { SalesChannelsManager } from '@/components/finance/sales-channels/SalesChannelsManager';

type FinanceTab = 'dashboard' | 'weekly-reports' | 'advanced-reports' | 'upload' | 'sales-channels';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const canManageData = hasRoleAccess(user?.role, 'manager');
  const isAdmin = hasRoleAccess(user?.role, 'admin');

  // Quick navigation items for the new finance structure
  const quickNavItems = [
    {
      title: 'Dashboard',
      description: 'View financial metrics and performance',
      icon: LayoutDashboard,
      href: '/dashboard/finance/dashboard',
      color: 'bg-blue-500'
    },
    {
      title: 'Invoice Management',
      description: 'Manage uploaded invoices and receipts',
      icon: FileText,
      href: '/dashboard/finance/invoices',
      color: 'bg-green-500'
    },
    ...(canManageData ? [
      {
        title: 'Create Invoice',
        description: 'Generate professional invoices for clients',
        icon: Plus,
        href: '/dashboard/finance/create-invoice',
        color: 'bg-purple-500'
      },
      {
        title: 'Clients',
        description: 'Manage client information and billing',
        icon: Users,
        href: '/dashboard/finance/clients',
        color: 'bg-orange-500'
      },
      {
        title: 'Reports',
        description: 'Advanced financial analytics',
        icon: BarChart3,
        href: '/dashboard/finance/reports',
        color: 'bg-indigo-500'
      }
    ] : []),
    ...(isAdmin ? [
      {
        title: 'Payment Settings',
        description: 'Configure Stripe and bank accounts',
        icon: Settings,
        href: '/dashboard/finance/settings',
        color: 'bg-red-500'
      }
    ] : [])
  ];

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

      {/* New Finance Features Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            New: Invoice Creation & Management
          </CardTitle>
          <CardDescription>
            Create professional invoices, manage clients, and accept payments with our new invoice system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickNavItems.map((item) => (
              <Card key={item.href} className="group cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate(item.href)}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${item.color} text-white flex-shrink-0`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {item.title}
                        <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legacy Tab Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Legacy Finance Tools</CardTitle>
          <CardDescription>
            Existing finance tools and data management features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FinanceTab)}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-fit">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
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
              <TabsTrigger value="sales-channels" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Sales Channels</span>
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

            <TabsContent value="sales-channels" className="space-y-6 mt-6">
              <SalesChannelsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}