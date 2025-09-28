import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

// Import report components
import { ReportsControls } from '../reports/ReportsControls';
import { InventoryMetricsCards } from '../reports/InventoryMetricsCards';
import { TeamValueChart } from '../reports/TeamValueChart';
import { TransactionRecordsChart } from '../reports/TransactionRecordsChart';
import { SalesMetricsCards } from '../reports/SalesMetricsCards';
import { TeamSalesChart } from '../reports/TeamSalesChart';

// Import services and types
import { 
  inventoryReportsService, 
  InventoryValueSummary, 
  DailyMovement,
  WeeklyMovement,
  MonthlyTeamPerformance 
} from '@/services/inventoryReportsService';
import { 
  salesReportsService,
  SalesMetrics,
  TeamSalesData
} from '@/services/salesReportsService';

interface Team {
  id: string;
  name: string;
}

interface ReportsTabProps {
  defaultTeamId?: string;
  warehouseId?: string;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ defaultTeamId, warehouseId }) => {
  // State management
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(defaultTeamId);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const [isLoading, setIsLoading] = useState(false);

  // Data state
  const [inventoryValue, setInventoryValue] = useState<InventoryValueSummary[]>([]);
  const [dailyMovements, setDailyMovements] = useState<DailyMovement[]>([]);
  const [weeklyMovements, setWeeklyMovements] = useState<WeeklyMovement[]>([]);
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyTeamPerformance[]>([]);
  
  // Sales data state
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [teamSalesData, setTeamSalesData] = useState<TeamSalesData[]>([]);

  // Load teams on mount
  useEffect(() => {
    loadTeams();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadReportData();
  }, [selectedTeam, timeRange, selectedDate]);

  const loadTeams = async () => {
    try {
      const teamsData = await inventoryReportsService.getTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    }
  };

  const loadReportData = async () => {
    setIsLoading(true);
    
    try {
      // Always load current inventory value (use warehouse-specific if available)
      const valueData = warehouseId 
        ? await inventoryReportsService.getWarehouseInventoryValue(warehouseId)
        : await inventoryReportsService.getRealTimeInventoryValue(selectedTeam);
      
      setInventoryValue(valueData);

      // Load sales data
      await loadSalesData();

      // Load data based on time range
      switch (timeRange) {
        case 'daily':
          await loadDailyData();
          break;
        case 'weekly':
          await loadWeeklyData();
          break;
        case 'monthly':
          await loadMonthlyData();
          break;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyData = async () => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Use warehouse-specific function if we have a warehouseId
      const movements = warehouseId 
        ? await inventoryReportsService.getWarehouseDailyMovements(organizationId!, warehouseId, dateString)
        : await inventoryReportsService.getDailyMovements(organizationId!, dateString, selectedTeam);
      
      setDailyMovements(movements);
    } catch (error) {
      console.error('Error loading daily data:', error);
    }
  };

  const loadWeeklyData = async () => {
    try {
      // Load weekly movements for the selected week
      const weekStart = format(subDays(selectedDate, 7), 'yyyy-MM-dd');
      const weekEnd = format(selectedDate, 'yyyy-MM-dd');
      const movements = await inventoryReportsService.getWeeklyMovements(weekStart, weekEnd);
      setWeeklyMovements(movements);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const loadMonthlyData = async () => {
    try {
      // Load monthly performance for the selected month
      const monthStart = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), 'yyyy-MM-dd');
      const monthEnd = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd');
      const performance = await inventoryReportsService.getMonthlyTeamPerformance(monthStart, monthEnd);
      setMonthlyPerformance(performance);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const loadSalesData = async () => {
    try {
      let startDate: string;
      let endDate: string;

      // Calculate date range based on time range selection
      switch (timeRange) {
        case 'daily':
          startDate = format(selectedDate, 'yyyy-MM-dd');
          endDate = format(selectedDate, 'yyyy-MM-dd');
          break;
        case 'weekly':
          startDate = format(subDays(selectedDate, 7), 'yyyy-MM-dd');
          endDate = format(selectedDate, 'yyyy-MM-dd');
          break;
        case 'monthly':
          startDate = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), 'yyyy-MM-dd');
          endDate = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd');
          break;
      }

      // Load sales metrics and team data
      const [metrics, teamData] = await Promise.all([
        salesReportsService.getSalesMetrics(startDate, endDate, selectedTeam),
        selectedTeam ? [] : salesReportsService.getTeamSalesData(startDate, endDate)
      ]);

      setSalesMetrics(metrics);
      setTeamSalesData(teamData);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon');
  };

  const handleRefresh = () => {
    loadReportData();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <ReportsControls
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamChange={setSelectedTeam}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
      />

      {/* Metrics Overview */}
      <InventoryMetricsCards 
        summaryData={inventoryValue}
        salesMetrics={salesMetrics || undefined}
        isLoading={isLoading}
      />

      {/* Sales Metrics - Show when we have sales data */}
      {salesMetrics && salesMetrics.totalSalesTransactions > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Sales Performance</h3>
          <SalesMetricsCards 
            salesMetrics={salesMetrics}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Main Reports Tabs */}
      <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as 'daily' | 'weekly' | 'monthly')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Daily View
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Weekly View
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Monthly View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamValueChart data={inventoryValue} isLoading={isLoading} />
            <TransactionRecordsChart 
              data={dailyMovements} 
              selectedDate={format(selectedDate, 'yyyy-MM-dd')}
              isLoading={isLoading}
            />
          </div>
          
          {/* Team Sales Performance - Show when not filtering by specific team */}
          {!selectedTeam && teamSalesData.length > 0 && (
            <TeamSalesChart 
              data={teamSalesData}
              isLoading={isLoading}
              showProfit={true}
            />
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamValueChart data={inventoryValue} chartType="pie" isLoading={isLoading} />
            {teamSalesData.length > 0 ? (
              <TeamSalesChart 
                data={teamSalesData}
                chartType="pie"
                isLoading={isLoading}
              />
            ) : (
              <div className="h-80 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                Weekly Movement Trends - Coming Soon
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamValueChart data={inventoryValue} isLoading={isLoading} />
            {teamSalesData.length > 0 ? (
              <TeamSalesChart 
                data={teamSalesData}
                isLoading={isLoading}
                showProfit={true}
              />
            ) : (
              <div className="h-80 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                Monthly Team Performance - Coming Soon
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};