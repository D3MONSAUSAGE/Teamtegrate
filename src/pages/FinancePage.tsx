import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSalesManager } from '@/hooks/useSalesManager';
import { CacheManagerProvider } from '@/components/finance/analytics/CacheManager';
import { TooltipProvider } from "@/components/ui/tooltip";
import { 
  LayoutDashboard, 
  Upload, 
  Database, 
  FileText, 
  BarChart3,
  Settings
} from 'lucide-react';
import ModernPageHeader from '@/components/ui/ModernPageHeader';
import FinanceDashboardOverview from '@/components/finance/dashboard/FinanceDashboardOverview';
import SmartUploadCenter from '@/components/finance/dashboard/SmartUploadCenter';
import DataBrowser from '@/components/finance/dashboard/DataBrowser';
import ReportGallery from '@/components/finance/dashboard/ReportGallery';
import DailySalesManager from '@/components/finance/DailySalesManager';

type FinanceView = 'dashboard' | 'upload' | 'data' | 'reports' | 'analytics' | 'legacy';

const FinancePage: React.FC = () => {
  const isMobile = useIsMobile();
  const [currentView, setCurrentView] = useState<FinanceView>('dashboard');
  
  const {
    selectedWeek,
    selectedTeam,
    setSelectedTeam,
    teams,
    weeksWithData,
    salesData,
    weeklyData,
    isLoading
  } = useSalesManager();

  const navigationItems = [
    {
      id: 'dashboard' as FinanceView,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview and quick actions'
    },
    {
      id: 'upload' as FinanceView,
      label: 'Upload Center',
      icon: Upload,
      description: 'Upload sales data'
    },
    {
      id: 'data' as FinanceView,
      label: 'Data Browser',
      icon: Database,
      description: 'View and manage data'
    },
    {
      id: 'reports' as FinanceView,
      label: 'Report Gallery',
      icon: FileText,
      description: 'Generate reports'
    },
    {
      id: 'analytics' as FinanceView,
      label: 'Custom Analytics',
      icon: BarChart3,
      description: 'Advanced analysis'
    },
    {
      id: 'legacy' as FinanceView,
      label: 'Legacy View',
      icon: Settings,
      description: 'Original interface'
    }
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <FinanceDashboardOverview
            onNavigateToUpload={() => setCurrentView('upload')}
            onNavigateToReports={() => setCurrentView('reports')}
            onNavigateToData={() => setCurrentView('data')}
          />
        );
      case 'upload':
        return <SmartUploadCenter onBackToDashboard={() => setCurrentView('dashboard')} />;
      case 'data':
        return <DataBrowser onBackToDashboard={() => setCurrentView('dashboard')} />;
      case 'reports':
        return (
          <ReportGallery
            onBackToDashboard={() => setCurrentView('dashboard')}
            onNavigateToAnalytics={() => setCurrentView('analytics')}
          />
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="mb-4 -ml-4"
                >
                  ← Back to Dashboard
                </Button>
                <h1 className="text-2xl font-bold">Custom Analytics</h1>
                <p className="text-muted-foreground">Build custom reports and advanced analytics</p>
              </div>
            </div>
            <DailySalesManager />
          </div>
        );
      case 'legacy':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('dashboard')}
                  className="mb-4 -ml-4"
                >
                  ← Back to Dashboard
                </Button>
                <h1 className="text-2xl font-bold">Legacy Interface</h1>
                <p className="text-muted-foreground">Original tabbed interface for advanced users</p>
              </div>
            </div>
            <DailySalesManager />
          </div>
        );
      default:
        return null;
    }
  };

  const getHeaderStats = () => {
    if (!weeklyData) return [];
    
    return [
      {
        label: 'Weekly Revenue',
        value: `$${weeklyData.totals.grossTotal.toLocaleString()}`,
        color: 'text-emerald-600'
      },
      {
        label: 'Net Sales',
        value: `$${weeklyData.totals.netSales.toLocaleString()}`,
        color: 'text-blue-600'
      },
      {
        label: 'Total Records',
        value: salesData.length.toString(),
        color: 'text-purple-600'
      }
    ];
  };

  return (
    <CacheManagerProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
          <div className="relative pt-6 px-4 md:px-6 lg:px-8 space-y-8">
            {/* Modern Header - Only show on dashboard */}
            {currentView === 'dashboard' && (
              <div className="animate-fade-in">
                <ModernPageHeader
                  title="Finance Management"
                  subtitle="Comprehensive financial analytics and data management platform"
                  icon={LayoutDashboard}
                  stats={getHeaderStats()}
                  badges={[
                    { label: 'Live Data', variant: 'default' },
                    { label: 'Multi-POS Support', variant: 'secondary' }
                  ]}
                />
              </div>
            )}

            {/* Navigation Pills - Only show on dashboard */}
            {currentView === 'dashboard' && (
              <div className="animate-fade-in delay-100">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {navigationItems.slice(0, -1).map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => setCurrentView(item.id)}
                      className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-gradient-to-br hover:from-muted/50 hover:to-muted/30 border border-border/50 rounded-xl group transition-all duration-200"
                    >
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:scale-110 transition-transform duration-200">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-sm">{item.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
                
                {/* Legacy Access Button */}
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentView('legacy')}
                    size="sm"
                    className="gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Access Legacy Interface
                  </Button>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="animate-fade-in delay-200">
              {renderCurrentView()}
            </div>

            {/* Bottom Padding */}
            <div className="pb-8" />
          </div>
        </div>
      </TooltipProvider>
    </CacheManagerProvider>
  );
};

export default FinancePage;