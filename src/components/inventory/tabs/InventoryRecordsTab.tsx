import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { TeamSelector } from '@/components/team/TeamSelector';
import { InventoryAnalyticsDashboard } from '@/components/inventory/analytics/InventoryAnalyticsDashboard';
import { CountDetailsDialog } from '../CountDetailsDialog';
import { Search, Download, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { InventoryCount } from '@/contexts/inventory/types';

export const InventoryRecordsTab: React.FC = () => {
  const { counts, alerts } = useInventory();
  const { hasRoleAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const filteredCounts = counts.filter(count => {
    const matchesSearch = searchTerm === '' || 
      count.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === '' || count.team_id === selectedTeam;
    return matchesSearch && matchesTeam;
  });

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

  const handleViewDetails = (count: InventoryCount) => {
    setSelectedCount(count);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Inventory Records</h2>
          <p className="text-muted-foreground">
            View historical inventory counts and performance analytics
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {hasRoleAccess('admin') && (
          <div className="min-w-[200px]">
            <TeamSelector 
              showAllOption={true}
              placeholder="Filter by team"
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Counts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredCounts.filter(c => c.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredCounts.filter(c => c.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alerts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Inventory Count History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No inventory records found
              </div>
            ) : (
              <>
                {/* Show first 6 records normally */}
                <div className="space-y-4">
                  {filteredCounts.slice(0, 6).map((count) => (
                    <div
                      key={count.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={getStatusColor(count.status)}>
                            {count.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Started: {format(new Date(count.created_at), 'MMM dd, yyyy \'at\' h:mm a')}
                            {count.status === 'completed' && count.updated_at && (
                              <span className="block">
                                Completed: {format(new Date(count.updated_at), 'MMM dd, yyyy \'at\' h:mm a')} 
                                ({differenceInMinutes(new Date(count.updated_at), new Date(count.created_at))}min)
                              </span>
                            )}
                          </span>
                          {count.variance_count > 0 && (
                            <Badge variant={getVarianceColor(count.variance_count)} className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {count.variance_count} variances
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {count.notes || 'No notes provided'}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div className="text-sm">
                          <div className="font-medium">
                            {count.completion_percentage.toFixed(0)}% Complete
                          </div>
                          <div className="text-muted-foreground">
                            {count.total_items_count} items
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(count)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show remaining records in ScrollArea */}
                {filteredCounts.length > 6 && (
                  <ScrollArea className="h-96 w-full">
                    <div className="space-y-4 pr-4">
                      {filteredCounts.slice(6).map((count) => (
                        <div
                          key={count.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant={getStatusColor(count.status)}>
                                {count.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Started: {format(new Date(count.created_at), 'MMM dd, yyyy \'at\' h:mm a')}
                                {count.status === 'completed' && count.updated_at && (
                                  <span className="block">
                                    Completed: {format(new Date(count.updated_at), 'MMM dd, yyyy \'at\' h:mm a')} 
                                    ({differenceInMinutes(new Date(count.updated_at), new Date(count.created_at))}min)
                                  </span>
                                )}
                              </span>
                              {count.variance_count > 0 && (
                                <Badge variant={getVarianceColor(count.variance_count)} className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {count.variance_count} variances
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {count.notes || 'No notes provided'}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <div className="text-sm">
                              <div className="font-medium">
                                {count.completion_percentage.toFixed(0)}% Complete
                              </div>
                              <div className="text-muted-foreground">
                                {count.total_items_count} items
                              </div>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(count)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Section */}
      <InventoryAnalyticsDashboard />

      {/* Count Details Dialog */}
      <CountDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        count={selectedCount}
      />
    </div>
  );
};