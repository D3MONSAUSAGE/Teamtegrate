import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { AccrualHistoryEntry } from '@/types/employee';

interface TimeOffAccrualHistoryProps {
  userId: string;
  leaveType?: string;
}

export function TimeOffAccrualHistory({ userId, leaveType }: TimeOffAccrualHistoryProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['accrual-history', userId, leaveType],
    queryFn: async () => {
      let query = supabase
        .from('time_off_accrual_history')
        .select(`
          *,
          created_by_user:users!time_off_accrual_history_created_by_fkey(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (leaveType) {
        query = query.eq('leave_type', leaveType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AccrualHistoryEntry[];
    },
  });

  const TRANSACTION_COLORS: Record<string, string> = {
    frontload: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    carryover: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    manual_adjustment: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    admin_grant: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };

  const formatTransactionType = (type: string): string => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Accrual History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Accrual History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No accrual history yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Accrual History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="mt-1">
                {entry.hours_change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={TRANSACTION_COLORS[entry.transaction_type] || 'bg-gray-100 text-gray-800'}>
                    {formatTransactionType(entry.transaction_type)}
                  </Badge>
                  <span className="text-sm text-muted-foreground capitalize">
                    {entry.leave_type}
                  </span>
                </div>
                <p className="text-sm font-medium">
                  {entry.hours_change > 0 ? '+' : ''}{entry.hours_change} hours
                  <span className="text-muted-foreground ml-2">
                    ({entry.hours_before}h → {entry.hours_after}h)
                  </span>
                </p>
                {entry.reason && (
                  <p className="text-xs text-muted-foreground">{entry.reason}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                  {entry.created_by && (
                    <span> by {(entry as any).created_by_user?.name || 'System'}</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default TimeOffAccrualHistory;
