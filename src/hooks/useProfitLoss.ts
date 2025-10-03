import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfitLossData } from '@/types/expenses';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export function useProfitLoss(startDate?: Date, endDate?: Date, teamId?: string) {
  const start = startDate || startOfMonth(new Date());
  const end = endDate || endOfMonth(new Date());

  return useQuery({
    queryKey: ['profit-loss', format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'), teamId],
    queryFn: async (): Promise<ProfitLossData> => {
      // Fetch sales data for revenue
      let salesQuery = supabase
        .from('sales_data')
        .select('*')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      if (teamId) {
        salesQuery = salesQuery.eq('team_id', teamId);
      }

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Fetch expenses
      let expensesQuery = supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(name, type)
        `)
        .gte('expense_date', format(start, 'yyyy-MM-dd'))
        .lte('expense_date', format(end, 'yyyy-MM-dd'))
        .eq('status', 'paid');

      if (teamId) {
        expensesQuery = expensesQuery.eq('team_id', teamId);
      }

      const { data: expenses, error: expensesError } = await expensesQuery;
      if (expensesError) throw expensesError;

      // Calculate revenue
      const grossSales = salesData?.reduce((sum, day) => sum + day.gross_sales, 0) || 0;
      const netSales = salesData?.reduce((sum, day) => sum + day.net_sales, 0) || 0;

      // Calculate labor costs from sales data
      const laborCosts = salesData?.reduce((sum, day) => sum + (day.labor_cost || 0), 0) || 0;

      // Separate COGS and operating expenses
      const cogs = expenses?.filter(e => e.category?.type === 'variable' && 
        e.category.name.toLowerCase().includes('cogs')) || [];
      const cogsTotal = cogs.reduce((sum, e) => sum + e.amount, 0);

      const operatingExpenses = expenses?.filter(e => 
        !cogs.includes(e) && e.category?.type !== 'one_time') || [];
      const operatingExpensesTotal = operatingExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Calculate metrics
      const grossProfit = netSales - cogsTotal;
      const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

      const operatingIncome = grossProfit - operatingExpensesTotal - laborCosts;
      const operatingMargin = netSales > 0 ? (operatingIncome / netSales) * 100 : 0;

      const netIncome = operatingIncome;
      const netMargin = netSales > 0 ? (netIncome / netSales) * 100 : 0;

      const primeCost = cogsTotal + laborCosts;
      const primeCostPercentage = netSales > 0 ? (primeCost / netSales) * 100 : 0;

      // Group expenses by category
      const expensesByCategory = operatingExpenses.reduce((acc, exp) => {
        const categoryName = exp.category?.name || 'Other';
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            amount: 0,
            type: exp.category?.type || 'variable'
          };
        }
        acc[categoryName].amount += exp.amount;
        return acc;
      }, {} as Record<string, { category: string; amount: number; type: string }>);

      const cogsByCategory = cogs.reduce((acc, exp) => {
        const categoryName = exp.category?.name || 'Other';
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category: categoryName,
            amount: 0
          };
        }
        acc[categoryName].amount += exp.amount;
        return acc;
      }, {} as Record<string, { category: string; amount: number }>);

      return {
        period: {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd')
        },
        revenue: {
          grossSales,
          netSales
        },
        cogs: {
          total: cogsTotal,
          byCategory: Object.values(cogsByCategory)
        },
        grossProfit: {
          amount: grossProfit,
          margin: grossMargin
        },
        operatingExpenses: {
          total: operatingExpensesTotal,
          byCategory: Object.values(expensesByCategory)
        },
        laborCosts: {
          total: laborCosts,
          percentage: netSales > 0 ? (laborCosts / netSales) * 100 : 0
        },
        operatingIncome: {
          amount: operatingIncome,
          margin: operatingMargin
        },
        netIncome: {
          amount: netIncome,
          margin: netMargin
        },
        primeCost: {
          amount: primeCost,
          percentage: primeCostPercentage
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
