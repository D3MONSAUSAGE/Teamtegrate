import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  BarChart3,
  ArrowUpRight,
  Activity,
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useSalesManager } from '@/hooks/useSalesManager';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

const FinanceDashboardTab: React.FC = () => {
  const { user } = useAuth();
  const { 
    weeklyData, 
    salesData, 
    isLoading, 
    selectedTeam, 
    setSelectedTeam, 
    teams,
    selectedWeek,
    setSelectedWeek,
    weeksWithData 
  } = useSalesManager();
  
  const isManager = user?.role === 'manager';
  const isAdmin = hasRoleAccess(user?.role, 'admin');
  const isSuperAdmin = hasRoleAccess(user?.role, 'superadmin');

  // Show data for managers always, for admins/superadmins always (including 'all' teams)
  const shouldShowData = isManager || isAdmin || isSuperAdmin;
  const showTeamSelector = isAdmin || isSuperAdmin;
  
  // Debug logging
  console.log('[FinanceDashboard] User role:', user?.role);
  console.log('[FinanceDashboard] Selected team:', selectedTeam);
  console.log('[FinanceDashboard] Should show data:', shouldShowData);
  console.log('[FinanceDashboard] Weekly data exists:', !!weeklyData);
  console.log('[FinanceDashboard] Teams available:', teams?.length);

  const kpiCards = [
    {
      title: 'Weekly Revenue',
      value: shouldShowData && weeklyData ? `$${weeklyData.totals.grossTotal.toLocaleString()}` : '$--',
      change: shouldShowData ? '+12.5%' : '--',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: 'up'
    },
    {
      title: 'Net Sales',
      value: shouldShowData && weeklyData ? `$${weeklyData.totals.netSales.toLocaleString()}` : '$--',
      change: shouldShowData ? '+8.3%' : '--',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'up'
    },
    {
      title: 'Total Orders',
      value: shouldShowData && salesData?.length ? salesData.length.toLocaleString() : '--',
      change: shouldShowData ? '+15.3%' : '--',
      icon: Receipt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'up'
    },
    {
      title: 'Avg Order Value',
      value: shouldShowData && weeklyData && weeklyData.totals.grossTotal > 0 && salesData?.length ? 
        `$${(weeklyData.totals.grossTotal / salesData.length).toFixed(2)}` : '$--',
      change: shouldShowData ? '+3.2%' : '--',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: 'up'  
    },
    {
      title: 'Labor Cost %',
      value: shouldShowData && weeklyData?.totals.grossTotal > 0 ? 
        `${(weeklyData.totals.expenses / weeklyData.totals.grossTotal * 100).toFixed(1)}%` : '--%',
      change: shouldShowData ? 'Target <35%' : '--',
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      trend: 'neutral'
    },
    {
      title: 'Data Quality',
      value: shouldShowData && salesData?.length ? 
        `${Math.round((salesData.filter(d => d.netSales > 0).length / salesData.length) * 100)}%` : '--%',
      change: shouldShowData ? 'Excellent' : '--',
      icon: Activity,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      trend: 'up'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Team/Week Selection */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-muted/10 to-accent/5 p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                {isManager ? 'Your Team Dashboard' : 'Sales Overview'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {format(selectedWeek, 'EEEE, MMMM do, yyyy')} - Week {format(selectedWeek, 'w')}
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {showTeamSelector && (
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select 
                value={format(selectedWeek, 'yyyy-MM-dd')} 
                onValueChange={(value) => setSelectedWeek(new Date(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeksWithData.map((week) => (
                    <SelectItem key={format(week, 'yyyy-MM-dd')} value={format(week, 'yyyy-MM-dd')}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Week of {format(week, 'MMM d, yyyy')}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Loading and data status */}
          {isLoading && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/50 flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">
                Loading sales data...
              </p>
            </div>
          )}
          
          {!isLoading && shouldShowData && !weeklyData && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-700">
                No sales data found for the selected team and week. Try selecting a different week or check if data has been uploaded.
              </p>
            </div>
          )}
          
          {/* Current selections display */}
          {shouldShowData && (
            <div className="mt-4 flex items-center gap-4">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                <Activity className="w-3 h-3 mr-1" />
                {weeklyData?.location || 'Loading...'}
              </Badge>
              <Badge variant="outline">
                {salesData?.length || 0} records this week
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi) => (
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
                    {kpi.trend !== 'neutral' && (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        {kpi.change}
                      </span>
                    )}
                    {kpi.trend === 'neutral' && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {kpi.change}
                      </span>
                    )}
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

      {/* Performance Summary */}
      {shouldShowData && weeklyData && (
        <Card className="glass-card border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Weekly Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Gross Sales</p>
                <p className="text-xl font-bold">${weeklyData.totals.grossTotal.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Net Sales</p>
                <p className="text-xl font-bold">${weeklyData.totals.netSales.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Tips</p>
                <p className="text-xl font-bold">${weeklyData.totals.tips.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Cash Flow</p>
                <p className="text-xl font-bold">${weeklyData.totals.totalInHouseCash.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="glass-card border-0 shadow-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <TrendingUp className="h-5 w-5" />
              View Detailed Report
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <Receipt className="h-5 w-5" />
              Export Data
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <BarChart3 className="h-5 w-5" />
              Advanced Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboardTab;