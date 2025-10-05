import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, subWeeks } from 'date-fns';
import { WeeklyPayrollSummary, PayrollComparison, DailyPayrollData, TeamPayrollData } from '@/types/payroll';

export const useWeeklyPayrollData = (selectedWeek: Date, teamId?: string) => {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subWeeks(selectedWeek, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(selectedWeek, 1), { weekStartsOn: 1 });

  return useQuery({
    queryKey: ['weekly-payroll-data', format(weekStart, 'yyyy-MM-dd'), teamId],
    queryFn: async () => {
      // Fetch current week data from actual time entries
      let currentQuery = supabase
        .from('daily_time_summaries')
        .select(`
          work_date,
          total_work_minutes,
          calculated_labor_cost,
          user_id,
          users!inner(name, email, hourly_rate),
          organization_id
        `)
        .gte('work_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('work_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('work_date');

      const { data: currentWeekData, error: currentError } = await currentQuery;

      if (currentError) throw currentError;
      if (!currentWeekData || currentWeekData.length === 0) {
        return null;
      }

      // Fetch previous week data for comparison
      let prevQuery = supabase
        .from('daily_time_summaries')
        .select('total_work_minutes, calculated_labor_cost')
        .gte('work_date', format(prevWeekStart, 'yyyy-MM-dd'))
        .lte('work_date', format(prevWeekEnd, 'yyyy-MM-dd'));

      const { data: prevWeekData } = await prevQuery;

      // Fetch sales data for labor percentage calculations
      const { data: salesData } = await supabase
        .from('sales_data')
        .select('date, net_sales, team_id, teams(name)')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date');

      // Group time data by date
      const dailyDataMap = new Map<string, { hours: number; laborCost: number }>();
      currentWeekData.forEach(entry => {
        const dateKey = entry.work_date;
        const existing = dailyDataMap.get(dateKey) || { hours: 0, laborCost: 0 };
        existing.hours += (entry.total_work_minutes || 0) / 60;
        existing.laborCost += entry.calculated_labor_cost || 0;
        dailyDataMap.set(dateKey, existing);
      });

      // Create sales lookup
      const salesByDate = new Map<string, number>();
      salesData?.forEach(sale => {
        salesByDate.set(sale.date, (salesByDate.get(sale.date) || 0) + (sale.net_sales || 0));
      });

      // Calculate daily data combining time entries and sales
      const dailyData: DailyPayrollData[] = Array.from(dailyDataMap.entries()).map(([date, timeData]) => {
        const sales = salesByDate.get(date) || 0;
        
        return {
          date,
          hours: timeData.hours,
          laborCost: timeData.laborCost,
          sales,
          laborPercentage: sales > 0 ? (timeData.laborCost / sales) * 100 : 0,
          salesPerHour: timeData.hours > 0 ? sales / timeData.hours : 0,
          avgHourlyRate: timeData.hours > 0 ? timeData.laborCost / timeData.hours : 0,
        };
      }).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate team breakdown (if team data available)
      const teamMap = new Map<string, TeamPayrollData>();
      
      // Group sales by team
      const salesByTeam = new Map<string, { teamName: string; sales: number }>();
      salesData?.forEach(sale => {
        if (!sale.team_id) return;
        const teamName = (sale.teams as any)?.name || 'Unknown Team';
        const existing = salesByTeam.get(sale.team_id);
        if (existing) {
          existing.sales += sale.net_sales || 0;
        } else {
          salesByTeam.set(sale.team_id, {
            teamName,
            sales: sale.net_sales || 0
          });
        }
      });

      // For now, we'll aggregate all labor under "All Employees" since 
      // time_entries don't have team_id directly
      const totalHours = dailyData.reduce((sum, day) => sum + day.hours, 0);
      const totalLaborCost = dailyData.reduce((sum, day) => sum + day.laborCost, 0);
      const totalSales = dailyData.reduce((sum, day) => sum + day.sales, 0);

      if (totalHours > 0 || totalLaborCost > 0) {
        teamMap.set('all-employees', {
          teamId: 'all-employees',
          teamName: 'All Employees',
          hours: totalHours,
          laborCost: totalLaborCost,
          sales: totalSales,
          laborPercentage: totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0,
          salesPerHour: totalHours > 0 ? totalSales / totalHours : 0,
          avgHourlyRate: totalHours > 0 ? totalLaborCost / totalHours : 0,
        });
      }

      // Calculate team metrics
      const teamData: TeamPayrollData[] = Array.from(teamMap.values()).map(team => ({
        ...team,
        laborPercentage: team.sales > 0 ? (team.laborCost / team.sales) * 100 : 0,
        salesPerHour: team.hours > 0 ? team.sales / team.hours : 0,
        avgHourlyRate: team.hours > 0 ? team.laborCost / team.hours : 0,
      }));

      const summary: WeeklyPayrollSummary = {
        totalLaborCost,
        totalHours,
        totalSales,
        laborPercentage: totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0,
        salesPerLaborHour: totalHours > 0 ? totalSales / totalHours : 0,
        avgHourlyRate: totalHours > 0 ? totalLaborCost / totalHours : 0,
        dailyData,
        teamData,
      };

      // Calculate comparison with previous week
      let comparison: PayrollComparison | null = null;
      if (prevWeekData && prevWeekData.length > 0) {
        const prevTotalLaborCost = prevWeekData.reduce((sum, day) => sum + (day.calculated_labor_cost || 0), 0);
        const prevTotalHours = prevWeekData.reduce((sum, day) => sum + ((day.total_work_minutes || 0) / 60), 0);
        
        // Fetch previous week sales for comparison
        const { data: prevSalesData } = await supabase
          .from('sales_data')
          .select('net_sales')
          .gte('date', format(prevWeekStart, 'yyyy-MM-dd'))
          .lte('date', format(prevWeekEnd, 'yyyy-MM-dd'));
        
        const prevTotalSales = prevSalesData?.reduce((sum, day) => sum + (day.net_sales || 0), 0) || 0;
        const prevLaborPercentage = prevTotalSales > 0 ? (prevTotalLaborCost / prevTotalSales) * 100 : 0;
        const prevSalesPerHour = prevTotalHours > 0 ? prevTotalSales / prevTotalHours : 0;

        comparison = {
          laborCostChange: prevTotalLaborCost > 0 ? ((totalLaborCost - prevTotalLaborCost) / prevTotalLaborCost) * 100 : 0,
          hoursChange: prevTotalHours > 0 ? ((totalHours - prevTotalHours) / prevTotalHours) * 100 : 0,
          salesChange: prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0,
          laborPercentageChange: prevLaborPercentage > 0 ? summary.laborPercentage - prevLaborPercentage : 0,
          salesPerHourChange: prevSalesPerHour > 0 ? ((summary.salesPerLaborHour - prevSalesPerHour) / prevSalesPerHour) * 100 : 0,
        };
      }

      return { summary, comparison };
    },
  });
};
