import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionCategory, TransactionSummary } from '@/types/transactions';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export const useTransactions = (selectedWeek: Date, selectedLocation?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Calculate week date range
  const weekStart = format(startOfWeek(selectedWeek), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(selectedWeek), 'yyyy-MM-dd');

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data.length === 0) {
        // Create default categories if none exist
        await createDefaultCategories();
        return;
      }

      setCategories(data as any[]);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setError(error.message);
    }
  };

  const createDefaultCategories = async () => {
    const defaultCategories = [
      { name: 'Sales Revenue', type: 'income', color: '#10b981', is_default: true },
      { name: 'Other Income', type: 'income', color: '#059669', is_default: true },
      { name: 'Food Costs', type: 'expense', color: '#ef4444', is_default: true },
      { name: 'Labor Costs', type: 'expense', color: '#f97316', is_default: true },
      { name: 'Rent', type: 'expense', color: '#8b5cf6', is_default: true },
      { name: 'Utilities', type: 'expense', color: '#06b6d4', is_default: true },
      { name: 'Marketing', type: 'expense', color: '#ec4899', is_default: true },
      { name: 'Supplies', type: 'expense', color: '#84cc16', is_default: true },
      { name: 'Insurance', type: 'expense', color: '#6366f1', is_default: true },
      { name: 'Maintenance', type: 'expense', color: '#f59e0b', is_default: true }
    ];

    try {
      const { data, error } = await supabase
        .from('transaction_categories')
        .insert(defaultCategories as any)
        .select();

      if (error) throw error;
      setCategories(data as any[]);
    } catch (error: any) {
      console.error('Error creating default categories:', error);
      setError(error.message);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:transaction_categories(*)
        `)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date', { ascending: false });

      if (selectedLocation && selectedLocation !== 'all') {
        query = query.eq('location', selectedLocation);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions((data as any[]) || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: any) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction as any)
        .select(`
          *,
          category:transaction_categories(*)
        `)
        .single();

      if (error) throw error;

      setTransactions(prev => [data as any, ...prev]);
      toast({
        title: "Success",
        description: "Transaction added successfully"
      });

      return data;
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:transaction_categories(*)
        `)
        .single();

      if (error) throw error;

      setTransactions(prev => prev.map(t => t.id === id ? data as any : t));
      toast({
        title: "Success",
        description: "Transaction updated successfully"
      });

      return data;
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const getTransactionSummary = (): TransactionSummary => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense' || t.type === 'fixed_cost')
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = categories
      .filter(c => c.type === 'expense')
      .map(category => {
        const total = transactions
          .filter(t => t.category_id === category.id && (t.type === 'expense' || t.type === 'fixed_cost'))
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          category_name: category.name,
          category_color: category.color,
          total
        };
      })
      .filter(c => c.total > 0);

    const incomeByCategory = categories
      .filter(c => c.type === 'income')
      .map(category => {
        const total = transactions
          .filter(t => t.category_id === category.id && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          category_name: category.name,
          category_color: category.color,
          total
        };
      })
      .filter(c => c.total > 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      expensesByCategory,
      incomeByCategory
    };
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchTransactions();
    }
  }, [selectedWeek, selectedLocation, categories.length]);

  return {
    transactions,
    categories,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions,
    getTransactionSummary
  };
};