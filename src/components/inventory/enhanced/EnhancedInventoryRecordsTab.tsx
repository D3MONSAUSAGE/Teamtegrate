import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedInventoryAnalytics } from '@/hooks/useEnhancedInventoryAnalytics';
import { TeamSelector } from '@/components/team/TeamSelector';
import { EnhancedCountDetailsDialog } from './EnhancedCountDetailsDialog';
import { CountComparisonDialog } from './CountComparisonDialog';
import { EnhancedAnalyticsDashboard } from './EnhancedAnalyticsDashboard';
import { 
  Search, Download, Calendar, TrendingUp, TrendingDown, AlertTriangle, DollarSign, 
  BarChart3, Users, Clock, ArrowUpRight, ArrowDownRight, Eye, GitCompare
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { InventoryCount } from '@/contexts/inventory/types';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export const EnhancedInventoryRecordsTab: React.FC = () => {
  const { counts, alerts, items, transactions } = useInventory();
  const { hasRoleAccess } = useAuth();
  const { metrics, chartData } = useEnhancedInventoryAnalytics(counts, alerts, items, transactions);
  
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

  // Filter counts based on search, team, date, and status
  const filteredCounts = counts.filter(count => {
    const matchesSearch = searchTerm === '' || 
      count.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ('Team ' + count.team_id)?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  // Sort counts by most recent first
  const sortedCounts = [...filteredCounts].sort((a, b) => 
    new Date(b.count_date).getTime() - new Date(a.count_date).getTime()
  );

  const handleViewDetails = (count: InventoryCount) => {
    setSelectedCount(count);
    setIsDetailsDialogOpen(true);
  };

  const handleViewComparison = (count: InventoryCount) => {
    setSelectedCount(count);
    setIsComparisonDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      default: return 'outline';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'default';
    if (Math.abs(variance) <= 5) return 'secondary';
    return 'destructive';
  };

  // Calculate financial metrics for filtered counts
  const calculateFilteredMetrics = () => {
    const completedCounts = filteredCounts.filter(c => c.status === 'completed');
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
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAnalyticsExport(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Analytics
          </Button>
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
            Export Inventory
          </Button>
        </div>
      </div>

      <Tabs defaultValue="records" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="records">Count Records</TabsTrigger>
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
                
                {hasRoleAccess('admin') && (
                  <TeamSelector 
                    showAllOption={true}
                    placeholder="Filter by team"
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
                  {metrics.teamPerformance.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Teams participating
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
                                  <Badge variant={getStatusColor(count.status)}>
                                    {count.status.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                  
                                  {count.team_id && (
                                    <Badge variant="outline" className="gap-1">
                                      <Users className="h-3 w-3" />
                                      Team {count.team_id}
                                    </Badge>
                                  )}
                                  
                                  {count.variance_count > 0 && (
                                    <Badge variant={getVarianceColor(count.variance_count)} className="gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {count.variance_count} variances
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
                                    <span className="font-medium">Notes: </span>
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

        <TabsContent value="analytics" className="space-y-6">
          <EnhancedAnalyticsDashboard 
            metrics={metrics} 
            chartData={chartData}
          />
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {/* Team Performance Overview */}
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
    </div>
  );
};