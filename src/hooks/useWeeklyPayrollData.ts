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
      // Fetch current week data
      let currentQuery = supabase
        .from('sales_data')
        .select('date, labor_cost, labor_hours, net_sales, team_id, teams(name)')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date');

      if (teamId) {
        currentQuery = currentQuery.eq('team_id', teamId);
      }

      const { data: currentWeekData, error: currentError } = await currentQuery;

      if (currentError) throw currentError;
      if (!currentWeekData || currentWeekData.length === 0) {
        return null;
      }

      // Fetch previous week data for comparison
      let prevQuery = supabase
        .from('sales_data')
        .select('labor_cost, labor_hours, net_sales')
        .gte('date', format(prevWeekStart, 'yyyy-MM-dd'))
        .lte('date', format(prevWeekEnd, 'yyyy-MM-dd'));

      if (teamId) {
        prevQuery = prevQuery.eq('team_id', teamId);
      }

      const { data: prevWeekData } = await prevQuery;

      // Calculate daily data
      const dailyData: DailyPayrollData[] = currentWeekData.map(day => {
        const hours = day.labor_hours || 0;
        const laborCost = day.labor_cost || 0;
        const sales = day.net_sales || 0;

        return {
          date: day.date,
          hours,
          laborCost,
          sales,
          laborPercentage: sales > 0 ? (laborCost / sales) * 100 : 0,
          salesPerHour: hours > 0 ? sales / hours : 0,
          avgHourlyRate: hours > 0 ? laborCost / hours : 0,
        };
      });

      // Calculate team breakdown
      const teamMap = new Map<string, TeamPayrollData>();
      currentWeekData.forEach(day => {
        if (!day.team_id) return;
        
        const teamName = (day.teams as any)?.name || 'Unknown Team';
        const existing = teamMap.get(day.team_id);
        
        if (existing) {
          existing.hours += day.labor_hours || 0;
          existing.laborCost += day.labor_cost || 0;
          existing.sales += day.net_sales || 0;
        } else {
          teamMap.set(day.team_id, {
            teamId: day.team_id,
            teamName,
            hours: day.labor_hours || 0,
            laborCost: day.labor_cost || 0,
            sales: day.net_sales || 0,
            laborPercentage: 0,
            salesPerHour: 0,
            avgHourlyRate: 0,
          });
        }
      });

      // Calculate team metrics
      const teamData: TeamPayrollData[] = Array.from(teamMap.values()).map(team => ({
        ...team,
        laborPercentage: team.sales > 0 ? (team.laborCost / team.sales) * 100 : 0,
        salesPerHour: team.hours > 0 ? team.sales / team.hours : 0,
        avgHourlyRate: team.hours > 0 ? team.laborCost / team.hours : 0,
      }));

      // Calculate totals
      const totalLaborCost = dailyData.reduce((sum, day) => sum + day.laborCost, 0);
      const totalHours = dailyData.reduce((sum, day) => sum + day.hours, 0);
      const totalSales = dailyData.reduce((sum, day) => sum + day.sales, 0);

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
        const prevTotalLaborCost = prevWeekData.reduce((sum, day) => sum + (day.labor_cost || 0), 0);
        const prevTotalHours = prevWeekData.reduce((sum, day) => sum + (day.labor_hours || 0), 0);
        const prevTotalSales = prevWeekData.reduce((sum, day) => sum + (day.net_sales || 0), 0);
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
