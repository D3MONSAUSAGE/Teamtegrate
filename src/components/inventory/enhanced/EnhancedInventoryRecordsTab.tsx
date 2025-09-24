import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedInventoryAnalytics } from '@/hooks/useEnhancedInventoryAnalytics';
import { useDailyInventoryAnalytics } from '@/hooks/useDailyInventoryAnalytics';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { StandardTeamSelector } from '@/components/teams';
import { EnhancedCountDetailsDialog } from './EnhancedCountDetailsDialog';
import { CountComparisonDialog } from './CountComparisonDialog';
import { EnhancedAnalyticsDashboard } from './EnhancedAnalyticsDashboard';
import { InventoryExportDialog } from '../export/InventoryExportDialog';
import { DailyInventoryMetrics } from '../daily/DailyInventoryMetrics';
import { DailyInventoryCharts } from '../daily/DailyInventoryCharts';
import { 
  Search, Download, Calendar, TrendingUp, TrendingDown, AlertTriangle, DollarSign, 
  BarChart3, Users, Clock, ArrowUpRight, ArrowDownRight, Eye, GitCompare, Ban, CalendarDays
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { InventoryCount } from '@/contexts/inventory/types';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export const EnhancedInventoryRecordsTab: React.FC = () => {
  const { counts, alerts, items, transactions, voidInventoryCount } = useInventory();
  const { hasRoleAccess, user } = useAuth();
  const { teams } = useTeamsByOrganization(user?.organizationId);

  // Create team name mapping
  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    (teams || []).forEach(team => map.set(team.id, team.name));
    return map;
  }, [teams]);

  // Helper function to get team display name
  const getTeamDisplayName = (teamId?: string | null) => {
    if (!teamId) return 'All Teams';
    return teamNameById.get(teamId) || teamId;
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isComparisonDialogOpen, setIsComparisonDialogOpen] = useState(false);
  const [showInventoryExport, setShowInventoryExport] = useState(false);
  const [exportCountId, setExportCountId] = useState<string | undefined>();
  const [exportTeamId, setExportTeamId] = useState<string | undefined>();
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [countToVoid, setCountToVoid] = useState<InventoryCount | null>(null);
  const [voidReason, setVoidReason] = useState('');
  
  // Daily view states
  const [viewMode, setViewMode] = useState<'all' | 'daily'>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filter counts based on search, team, date, status, and role-based access
  const filteredCounts = useMemo(() => {
    return counts.filter(count => {
      const matchesSearch = searchTerm === '' || 
        count.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTeamDisplayName(count.team_id)?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTeam = selectedTeam === '' || count.team_id === selectedTeam;
      
      const matchesStatus = statusFilter === 'all' || count.status === statusFilter;
      
      // Date filtering
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const countDate = new Date(count.count_date);
        const now = new Date();
        const daysAgo = parseInt(dateFilter);
        const filterDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        matchesDate = countDate >= filterDate;
      }
      
      return matchesSearch && matchesTeam && matchesStatus && matchesDate;
    });
  }, [counts, searchTerm, selectedTeam, statusFilter, dateFilter, getTeamDisplayName]);

  // Filter team-based analytics data
  const filteredAlertsForAnalytics = useMemo(() => {
    if (!selectedTeam) return alerts;
    // Filter alerts by items that might be associated with the team through counts
    const teamItemIds = new Set(
      filteredCounts
        .filter(count => count.team_id === selectedTeam)
        .flatMap(count => transactions
          .filter(t => t.transaction_type === 'count')
          .map(t => t.item_id)
        )
    );
    return alerts.filter(alert => teamItemIds.has(alert.item_id));
  }, [alerts, selectedTeam, filteredCounts, transactions]);

  const { metrics, chartData } = useEnhancedInventoryAnalytics(
    filteredCounts, 
    filteredAlertsForAnalytics, 
    items, 
    transactions
  );

  // Daily analytics for selected date
  const { metrics: dailyMetrics, chartData: dailyChartData } = useDailyInventoryAnalytics(
    counts,
    alerts,
    items,
    transactions,
    selectedDate
  );

  // Sort counts by most recent first (using updated_at for more accurate recent changes)
  const sortedCounts = [...filteredCounts].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.count_date).getTime();
    const bTime = new Date(b.updated_at || b.count_date).getTime();
    return bTime - aTime;
  });

  const handleViewDetails = (count: InventoryCount) => {
    setSelectedCount(count);
    setIsDetailsDialogOpen(true);
  };

  const handleViewComparison = (count: InventoryCount) => {
    setSelectedCount(count);
    setIsComparisonDialogOpen(true);
  };

  const handleVoidCount = (count: InventoryCount) => {
    setCountToVoid(count);
    setVoidDialogOpen(true);
  };

  const confirmVoidCount = async () => {
    if (!countToVoid) return;
    
    try {
      await voidInventoryCount(countToVoid.id, voidReason);
      setVoidDialogOpen(false);
      setCountToVoid(null);
      setVoidReason('');
    } catch (error) {
      console.error('Failed to void count:', error);
    }
  };

  const getStatusColor = (status: string, isVoided: boolean = false) => {
    if (isVoided) return 'outline';
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'default';
    if (Math.abs(variance) <= 5) return 'secondary';
    return 'destructive';
  };

  // Calculate financial metrics for filtered counts (excluding voided counts)
  const calculateFilteredMetrics = () => {
    const completedCounts = filteredCounts.filter(c => c.status === 'completed' && !c.is_voided);
    const totalValue = completedCounts.reduce((sum, count) => sum + (count.total_items_count * 25), 0); // Mock calculation
    const totalVarianceCost = completedCounts.reduce((sum, count) => sum + (count.variance_count * 15), 0);
    
    return { totalValue, totalVarianceCost, countCompletions: completedCounts.length };
  };

  const filteredMetrics = calculateFilteredMetrics();

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Enhanced Inventory Records</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive inventory history with financial insights and team performance tracking
            {selectedTeam && (
              <span className="block text-sm mt-1 text-primary">
                Showing data for: {getTeamDisplayName(selectedTeam)}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setExportCountId(undefined);
              setExportTeamId(selectedTeam || undefined);
              setShowInventoryExport(true);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Inventory Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="records" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="records">Count Records</TabsTrigger>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
          <TabsTrigger value="teams">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-6">
          {/* Enhanced Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {(hasRoleAccess('admin') || hasRoleAccess('manager')) && (
                  <StandardTeamSelector
                    selectedTeamId={selectedTeam || null}
                    onTeamChange={(teamId) => setSelectedTeam(teamId || '')}
                    showAllOption={hasRoleAccess('admin')}
                    placeholder="Filter by team"
                    variant="simple"
                  />
                )}

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Total Counts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredCounts.length}</div>
                <div className="text-sm text-muted-foreground">
                  {filteredMetrics.countCompletions} completed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredMetrics.totalValue)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Inventory counted
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Variance Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(filteredMetrics.totalVarianceCost)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total discrepancies
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Accuracy Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(metrics.accuracyRate)}
                </div>
                <div className={cn(
                  "text-sm flex items-center gap-1",
                  metrics.trendDirection === 'up' ? "text-green-600" : 
                  metrics.trendDirection === 'down' ? "text-red-600" : "text-muted-foreground"
                )}>
                  {metrics.trendDirection === 'up' ? <ArrowUpRight className="h-3 w-3" /> : 
                   metrics.trendDirection === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
                  {formatPercentage(Math.abs(metrics.monthlyComparison))} vs last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.averageCompletionTime.toFixed(1)}h
                </div>
                <div className="text-sm text-muted-foreground">
                  Completion time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedTeam ? 1 : metrics.teamPerformance.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedTeam ? 'Selected team' : 'Teams participating'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Records List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Enhanced Inventory Count History
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Showing {filteredCounts.length} records with financial insights and team comparisons
                {selectedTeam && (
                  <span className="block text-primary">
                    Team: {getTeamDisplayName(selectedTeam)}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedCounts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No inventory records found</h3>
                    <p>Try adjusting your search filters or create a new inventory count</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px] w-full">
                    <div className="space-y-4 pr-4">
                      {sortedCounts.map((count, index) => {
                        const previousCount = index < sortedCounts.length - 1 ? sortedCounts[index + 1] : null;
                        const mockValue = count.total_items_count * 25; // Mock calculation
                        const mockVarianceCost = count.variance_count * 15;
                        
                        return (
                          <div
                            key={count.id}
                            className="group p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            {/* Main count info */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                 <div className="flex items-center gap-3 mb-2">
                                   <Badge variant={getStatusColor(count.status, count.is_voided)}>
                                     {count.is_voided ? 'VOIDED' : 
                                      count.status === 'cancelled' ? 'CANCELLED' : 
                                      count.status.replace('_', ' ').toUpperCase()}
                                   </Badge>
                                   
                                   <Badge variant="outline" className="gap-1">
                                     <Users className="h-3 w-3" />
                                     {getTeamDisplayName(count.team_id)}
                                   </Badge>
                                   
                                   {count.variance_count > 0 && !count.is_voided && (
                                     <Badge variant={getVarianceColor(count.variance_count)} className="gap-1">
                                       <AlertTriangle className="h-3 w-3" />
                                       {count.variance_count} variances
                                     </Badge>
                                   )}

                                   {count.is_voided && (
                                     <Badge variant="outline" className="gap-1 text-muted-foreground">
                                       <Ban className="h-3 w-3" />
                                       No Financial Impact
                                     </Badge>
                                   )}
                                 </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div className="text-muted-foreground">Date & Time</div>
                                    <div className="font-medium">
                                      {format(new Date(count.count_date), 'MMM dd, yyyy')}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                      Started: {format(new Date(count.created_at), 'h:mm a')}
                                      {count.status === 'completed' && count.updated_at && (
                                        <span className="block">
                                          Completed: {format(new Date(count.updated_at), 'h:mm a')} 
                                          ({differenceInMinutes(new Date(count.updated_at), new Date(count.created_at))}min)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-muted-foreground">Performance</div>
                                    <div className="font-medium">
                                      {count.completion_percentage.toFixed(0)}% Complete
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                      {count.total_items_count} items • {count.variance_count} variances
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-muted-foreground">Financial Impact</div>
                                    <div className="font-medium text-green-600">
                                      {formatCurrency(mockValue)}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                      Variance cost: <span className="text-orange-600">{formatCurrency(mockVarianceCost)}</span>
                                    </div>
                                  </div>
                                </div>

                                {count.notes && (
                                  <div className="mt-3 p-2 bg-muted/30 rounded text-sm">
                                    <span className="font-medium">
                                      {count.status === 'cancelled' ? 'Cancellation Reason: ' : 'Notes: '}
                                    </span>
                                    {count.notes}
                                  </div>
                                )}
                              </div>

                               <div className="flex gap-2 ml-4">
                                 <Button 
                                   variant="outline" 
                                   size="sm"
                                   onClick={() => handleViewDetails(count)}
                                   className="gap-1"
                                 >
                                   <Eye className="h-3 w-3" />
                                   Enhanced Details
                                 </Button>
                                 
                                 {previousCount && (
                                   <Button 
                                     variant="outline" 
                                     size="sm"
                                     onClick={() => handleViewComparison(count)}
                                     className="gap-1"
                                   >
                                     <GitCompare className="h-3 w-3" />
                                     Compare
                                   </Button>
                                 )}

                                 {hasRoleAccess('superadmin') && !count.is_voided && (
                                   <Button 
                                     variant="outline" 
                                     size="sm"
                                     onClick={() => handleVoidCount(count)}
                                     className="gap-1 text-destructive hover:text-destructive"
                                   >
                                     <Ban className="h-3 w-3" />
                                     Void
                                   </Button>
                                 )}
                               </div>
                            </div>

                            {/* Quick comparison with previous count */}
                            {previousCount && (
                              <div className="mt-3 pt-3 border-t border-dashed">
                                <div className="text-xs text-muted-foreground mb-1">
                                  Quick comparison with previous count ({format(new Date(previousCount.count_date), 'MMM dd')})
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                  <div className="flex items-center gap-1">
                                    <span>Accuracy:</span>
                                    <span className={cn(
                                      "font-medium",
                                      count.completion_percentage >= previousCount.completion_percentage ? 
                                        "text-green-600" : "text-red-600"
                                    )}>
                                      {count.completion_percentage >= previousCount.completion_percentage ? 
                                        <ArrowUpRight className="h-3 w-3 inline" /> : 
                                        <ArrowDownRight className="h-3 w-3 inline" />}
                                      {formatPercentage(Math.abs(count.completion_percentage - previousCount.completion_percentage))}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <span>Variances:</span>
                                    <span className={cn(
                                      "font-medium",
                                      count.variance_count <= previousCount.variance_count ? 
                                        "text-green-600" : "text-red-600"
                                    )}>
                                      {count.variance_count <= previousCount.variance_count ? 
                                        <ArrowDownRight className="h-3 w-3 inline" /> : 
                                        <ArrowUpRight className="h-3 w-3 inline" />}
                                      {Math.abs(count.variance_count - previousCount.variance_count)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span>Items:</span>
                                    <span className="font-medium">
                                      {count.total_items_count > previousCount.total_items_count ? '+' : ''}
                                      {count.total_items_count - previousCount.total_items_count}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          {/* Daily View Header */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Daily Inventory View
              </h3>
              <p className="text-sm text-muted-foreground">
                Detailed view of inventory activities for a specific date
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
            </div>
          </div>

          {/* Daily Metrics */}
          <DailyInventoryMetrics 
            metrics={dailyMetrics} 
            selectedDate={selectedDate}
          />

          {/* Daily Charts */}
          <DailyInventoryCharts chartData={dailyChartData} />

          {/* Daily Transaction Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Activity Log
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                All inventory activities for {selectedDate.toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {counts
                    .filter(count => {
                      const countDate = new Date(count.count_date);
                      return countDate.toDateString() === selectedDate.toDateString();
                    })
                    .map((count) => (
                      <div key={count.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusColor(count.status, count.is_voided)}>
                            {count.is_voided ? 'VOIDED' : count.status}
                          </Badge>
                          <div>
                            <div className="font-medium">
                              Count #{count.id.slice(0, 8)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getTeamDisplayName(count.team_id)} • {format(new Date(count.count_date), 'HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {count.total_items_count} items
                          </div>
                          {count.variance_count > 0 && (
                            <div className="text-sm text-destructive">
                              {count.variance_count} variances
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  
                  {counts.filter(count => {
                    const countDate = new Date(count.count_date);
                    return countDate.toDateString() === selectedDate.toDateString();
                  }).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No activity on this date</h3>
                      <p>No inventory counts were performed on {selectedDate.toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <EnhancedAnalyticsDashboard 
            metrics={metrics} 
            chartData={chartData}
          />
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {/* Team Performance Overview */}
          {selectedTeam ? (
            // Show detailed view for selected team
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {getTeamDisplayName(selectedTeam)} Performance
                </CardTitle>
                <p className="text-muted-foreground">
                  Detailed performance analysis for the selected team
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {filteredCounts.filter(c => c.status === 'completed').length}
                    </div>
                    <div className="text-muted-foreground">Completed Counts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {filteredCounts.length > 0 ? 
                        formatPercentage(filteredCounts.reduce((sum, c) => sum + c.completion_percentage, 0) / filteredCounts.length) : 
                        '0%'
                      }
                    </div>
                    <div className="text-muted-foreground">Average Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {filteredCounts.reduce((sum, c) => sum + c.variance_count, 0)}
                    </div>
                    <div className="text-muted-foreground">Total Variances</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Show overview of all teams
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {metrics.teamPerformance.map((team) => (
                <Card key={team.teamId} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {team.teamName}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {team.countCompletions} counts completed
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Accuracy</div>
                        <div className="text-lg font-bold">{formatPercentage(team.accuracy)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Time</div>
                        <div className="text-lg font-bold">{team.completionTime.toFixed(1)}h</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Value</div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(team.inventoryValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Variance Cost</div>
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(team.varianceCost)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          team.improvementTrend === 'up' ? 'default' : 
                          team.improvementTrend === 'down' ? 'destructive' : 'secondary'
                        }
                        className="gap-1"
                      >
                        {team.improvementTrend === 'up' ? <TrendingUp className="h-3 w-3" /> :
                         team.improvementTrend === 'down' ? <TrendingDown className="h-3 w-3" /> :
                         <BarChart3 className="h-3 w-3" />}
                        {team.improvementTrend === 'up' ? 'Improving' :
                         team.improvementTrend === 'down' ? 'Declining' : 'Stable'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Enhanced Dialogs */}
      <EnhancedCountDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        count={selectedCount}
        previousCount={
          selectedCount && sortedCounts.length > 1 ? 
          sortedCounts[sortedCounts.findIndex(c => c.id === selectedCount.id) + 1] || null : 
          null
        }
      />

      <CountComparisonDialog
        open={isComparisonDialogOpen}
        onOpenChange={setIsComparisonDialogOpen}
        currentCount={selectedCount}
        previousCount={
          selectedCount && sortedCounts.length > 1 ? 
          sortedCounts[sortedCounts.findIndex(c => c.id === selectedCount.id) + 1] || null : 
          null
        }
        counts={sortedCounts}
      />

      <InventoryExportDialog
        open={showInventoryExport}
        onOpenChange={setShowInventoryExport}
        countId={exportCountId}
        teamId={exportTeamId}
      />

      {/* Void Confirmation Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Inventory Count</DialogTitle>
            <DialogDescription>
              This will void the inventory count, removing its financial impact while keeping it for audit purposes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for voiding (optional)</label>
              <Textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Enter reason for voiding this count..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmVoidCount}>
              Void Count
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};