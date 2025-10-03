import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { useExpenses, useExpenseCategories } from '@/hooks/useExpenses';
import { ExpenseList } from './ExpenseList';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseFilters } from './ExpenseFilters';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export function ExpenseTracker() {
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    categoryId: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  const { data: expenses, isLoading } = useExpenses(filters);
  const { data: categories } = useExpenseCategories();

  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const pendingCount = expenses?.filter(e => e.status === 'pending').length || 0;
  const approvedCount = expenses?.filter(e => e.status === 'approved').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expense Tracker</h2>
          <p className="text-muted-foreground">
            Track and manage business expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-3xl">${totalExpenses.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Approval</CardDescription>
            <CardTitle className="text-3xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl">{approvedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {showFilters && (
        <ExpenseFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories || []}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <ExpenseList expenses={expenses || []} />
          )}
        </CardContent>
      </Card>

      {showForm && (
        <ExpenseForm
          onClose={() => setShowForm(false)}
          categories={categories || []}
        />
      )}
    </div>
  );
}
