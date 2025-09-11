import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Users, 
  Calendar,
  Upload,
  FileText,
  BarChart3,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { WeeklySalesButton } from './WeeklySalesButton';
import { useSalesManager } from '@/hooks/useSalesManager';

interface FinanceDashboardOverviewProps {
  onNavigateToUpload: () => void;
  onNavigateToReports: () => void;
  onNavigateToData: () => void;
  onNavigateToAnalytics: () => void;
}

const FinanceDashboardOverview: React.FC<FinanceDashboardOverviewProps> = ({
  onNavigateToUpload,
  onNavigateToReports,
  onNavigateToData,
  onNavigateToAnalytics
}) => {
  const { weeklyData, salesData, isLoading } = useSalesManager();

  const kpiCards = [
    {
      title: 'Weekly Revenue',
      value: weeklyData ? `$${weeklyData.totals.grossTotal.toLocaleString()}` : '$0',
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: 'up'
    },
    {
      title: 'Net Sales',
      value: weeklyData ? `$${weeklyData.totals.netSales.toLocaleString()}` : '$0',
      change: '+8.3%',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'up'
    },
    {
      title: 'Total Cash',
      value: weeklyData ? `$${weeklyData.totals.totalCash.toLocaleString()}` : '$0',
      change: '+5.2%',
      icon: Receipt,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      trend: 'up'
    },
    {
      title: 'Order Count',
      value: salesData?.length ? salesData.length.toLocaleString() : '0',
      change: '+15.3%',
      icon: Receipt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'up'
    },
    {
      title: 'Avg Order Value',
      value: weeklyData && weeklyData.totals.grossTotal > 0 && salesData?.length ? 
        `$${(weeklyData.totals.grossTotal / salesData.length).toFixed(2)}` : '$0',
      change: '+3.2%',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: 'up'
    },
    {
      title: 'Data Quality',
      value: salesData?.length ? 
        `${Math.round((salesData.filter(d => d.netSales > 0).length / salesData.length) * 100)}%` : '0%',
      change: 'Excellent',
      icon: Activity,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      trend: 'up'
    }
  ];

  const quickActions = [
    {
      title: 'Upload Sales Data',
      description: 'Add new sales reports from your POS system',
      icon: Upload,
      onClick: onNavigateToUpload,
      gradient: 'from-emerald-500 to-emerald-600',
      disabled: false
    },
    {
      title: 'Advanced Analytics',
      description: 'Deep insights and performance analytics',
      icon: BarChart3,
      onClick: onNavigateToAnalytics,
      gradient: 'from-blue-500 to-blue-600',
      disabled: false
    },
    {
      title: 'Generate Reports',
      description: 'Create comprehensive business reports',
      icon: FileText,
      onClick: onNavigateToReports,
      gradient: 'from-purple-500 to-purple-600',
      disabled: false
    },
    {
      title: 'Browse Data',
      description: 'Review and manage your financial data',
      icon: Activity,
      onClick: onNavigateToData,
      gradient: 'from-amber-500 to-amber-600',
      disabled: false
    }
  ];

  const recentActivity = [
    {
      action: 'Sales data uploaded',
      time: '2 hours ago',
      status: 'success',
      details: 'Brink POS - Daily sales report'
    },
    {
      action: 'Weekly report generated',
      time: '1 day ago',
      status: 'success',
      details: 'Week ending March 15, 2024'
    },
    {
      action: 'Data validation completed',
      time: '2 days ago',
      status: 'warning',
      details: '2 minor discrepancies found'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-muted/10 to-accent/5 p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Finance Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {format(new Date(), 'EEEE, MMMM do, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <Activity className="w-3 h-3 mr-1" />
                Live Data
              </Badge>
              <Badge variant="outline">
                <Calendar className="w-3 h-3 mr-1" />
                Week {format(new Date(), 'w')}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary to-accent blur-2xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-accent to-primary blur-2xl" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={kpi.title} className="glass-card border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {kpi.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-foreground">
                      {isLoading ? '...' : kpi.value}
                    </h3>
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Overview */}
      <Card className="glass-card border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium">Total Records</span>
                  <Badge variant="secondary">{salesData?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium">Current Week Sales</span>
                  <span className="font-semibold">${weeklyData?.totals.grossTotal.toLocaleString() || '0'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium">Labor Cost %</span>
                  <Badge variant={weeklyData && (weeklyData.totals.grossTotal > 0) && (weeklyData.totals.expenses / weeklyData.totals.grossTotal * 100) <= 35 ? "default" : "destructive"}>
                    {weeklyData?.totals.grossTotal > 0 ? `${(weeklyData.totals.expenses / weeklyData.totals.grossTotal * 100).toFixed(1)}%` : '0%'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Recent Activity</h4>
              <div className="space-y-2">
                {recentActivity.slice(0, 3).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                    <div className={`p-1 rounded-full ${
                      activity.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                      activity.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Activity className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass-card border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={action.title}
                variant="ghost"
                onClick={action.onClick}
                disabled={action.disabled}
                className="h-auto p-6 flex flex-col items-start gap-3 hover:bg-gradient-to-br hover:from-muted/50 hover:to-muted/30 border border-border/50 rounded-xl group transition-all duration-200"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="glass-card border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className={`p-2 rounded-full ${
                  activity.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                  activity.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.details}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboardOverview;