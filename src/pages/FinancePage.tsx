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
  Activity
} from 'lucide-react';
import ModernPageHeader from '@/components/ui/ModernPageHeader';
import FinanceDashboardOverview from '@/components/finance/dashboard/FinanceDashboardOverview';
import SmartUploadCenter from '@/components/finance/dashboard/SmartUploadCenter';
import DataBrowser from '@/components/finance/dashboard/DataBrowser';
import ReportGallery from '@/components/finance/dashboard/ReportGallery';
import AdvancedAnalyticsDashboard from '@/components/finance/analytics/AdvancedAnalyticsDashboard';

type FinanceView = 'dashboard' | 'upload' | 'data' | 'reports' | 'analytics';

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
      description: 'Overview and key metrics'
    },
    {
      id: 'analytics' as FinanceView,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Advanced insights'
    },
    {
      id: 'upload' as FinanceView,
      label: 'Upload Data',
      icon: Upload,
      description: 'Add sales reports'
    },
    {
      id: 'reports' as FinanceView,
      label: 'Reports',
      icon: FileText,
      description: 'Generate reports'
    },
    {
      id: 'data' as FinanceView,
      label: 'Browse Data',
      icon: Database,
      description: 'View and manage data'
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
            onNavigateToAnalytics={() => setCurrentView('analytics')}
          />
        );
      case 'analytics':
        return <AdvancedAnalyticsDashboard onBackToDashboard={() => setCurrentView('dashboard')} />;
      case 'upload':
        return <SmartUploadCenter onBackToDashboard={() => setCurrentView('dashboard')} />;
      case 'reports':
        return (
          <ReportGallery
            onBackToDashboard={() => setCurrentView('dashboard')}
            onNavigateToAnalytics={() => setCurrentView('analytics')}
          />
        );
      case 'data':
        return <DataBrowser onBackToDashboard={() => setCurrentView('dashboard')} />;
      default:
        return <div>View not found</div>;
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {navigationItems.map((item) => (
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