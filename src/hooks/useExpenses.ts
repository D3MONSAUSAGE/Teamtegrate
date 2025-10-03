import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseCategory } from '@/types/expenses';
import { toast } from 'sonner';

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ExpenseCategory[];
    }
  });
}

export function useExpenses(filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  status?: string;
  teamId?: string;
}) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:expense_categories(*)
        `)
        .order('expense_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('expense_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('expense_date', filters.endDate);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.teamId) {
        query = query.eq('team_id', filters.teamId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Expense[];
    }
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'organization_id' | 'user_id'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          amount: expense.amount,
          description: expense.description,
          expense_date: expense.expense_date,
          category_id: expense.category_id,
          user_id: userData.user.id,
          team_id: expense.team_id,
          vendor_name: expense.vendor_name,
          receipt_url: expense.receipt_url,
          payment_method: expense.payment_method,
          invoice_number: expense.invoice_number,
          notes: expense.notes,
          tags: expense.tags,
          is_recurring: expense.is_recurring,
          recurring_frequency: expense.recurring_frequency,
          status: expense.status,
          approved_by: expense.approved_by,
          approved_at: expense.approved_at,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create expense: ${error.message}`);
    }
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update expense: ${error.message}`);
    }
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete expense: ${error.message}`);
    }
  });
}
