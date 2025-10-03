import React from 'react';
import { Expense } from '@/types/expenses';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/utils/formatters';

interface ExpenseListProps {
  expenses: Expense[];
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No expenses found. Create your first expense to get started.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'rejected':
        return 'bg-red-500/10 text-red-500';
      case 'paid':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start gap-4 flex-1">
            <div
              className="w-2 h-full rounded-full"
              style={{ backgroundColor: expense.category?.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{expense.description}</h4>
                <Badge variant="outline" className={getStatusColor(expense.status)}>
                  {expense.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{expense.category?.name}</span>
                <span>•</span>
                <span>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</span>
                {expense.vendor_name && (
                  <>
                    <span>•</span>
                    <span>{expense.vendor_name}</span>
                  </>
                )}
              </div>
              {expense.tags && expense.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {expense.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-bold text-lg">
                {formatCurrency(expense.amount)}
              </div>
              {expense.payment_method && (
                <div className="text-xs text-muted-foreground capitalize">
                  {expense.payment_method.replace('_', ' ')}
                </div>
              )}
            </div>

            {expense.receipt_url && (
              <Button variant="ghost" size="icon" asChild>
                <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4" />
                </a>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Approve</DropdownMenuItem>
                <DropdownMenuItem>Reject</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
