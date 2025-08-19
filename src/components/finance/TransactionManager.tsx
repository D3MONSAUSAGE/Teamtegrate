import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";
import { format } from 'date-fns';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import PettyCashManager from './PettyCashManager';
import RecurringTransactionManager from './RecurringTransactionManager';
import { useTransactions } from '@/hooks/useTransactions';

interface TransactionManagerProps {
  selectedWeek: Date;
  selectedLocation?: string;
  locations: string[];
}

const TransactionManager: React.FC<TransactionManagerProps> = ({
  selectedWeek,
  selectedLocation,
  locations
}) => {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const {
    transactions,
    categories,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionSummary
  } = useTransactions(selectedWeek, selectedLocation);

  const summary = getTransactionSummary();

  const handleAddTransaction = async (transactionData: any) => {
    try {
      await addTransaction(transactionData);
      setShowTransactionForm(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleEditTransaction = async (transactionData: any) => {
    if (!editingTransaction) return;
    
    try {
      await updateTransaction(editingTransaction.id, transactionData);
      setEditingTransaction(null);
      setShowTransactionForm(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.transactionCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Week Info */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Transactions</CardTitle>
          <CardDescription>
            Week of {format(selectedWeek, 'MMM d, yyyy')} 
            {selectedLocation && selectedLocation !== 'all' && ` • ${selectedLocation}`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Transaction Management Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="recurring">Fixed Costs</TabsTrigger>
          <TabsTrigger value="petty-cash">Petty Cash</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">All Transactions</h3>
              <p className="text-sm text-muted-foreground">
                Manage income, expenses, and one-time transactions
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingTransaction(null);
                setShowTransactionForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>
          </div>

          {showTransactionForm && (
            <TransactionForm
              categories={categories}
              locations={locations}
              editingTransaction={editingTransaction}
              onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
              onCancel={() => {
                setShowTransactionForm(false);
                setEditingTransaction(null);
              }}
            />
          )}

          <TransactionList
            transactions={transactions}
            categories={categories}
            loading={loading}
            onEdit={(transaction) => {
              setEditingTransaction(transaction);
              setShowTransactionForm(true);
            }}
            onDelete={deleteTransaction}
          />
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <RecurringTransactionManager 
            categories={categories}
            locations={locations}
          />
        </TabsContent>

        <TabsContent value="petty-cash" className="space-y-4">
          <PettyCashManager locations={locations} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories */}
            {summary.expensesByCategory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary.expensesByCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.category_color }}
                        />
                        <span className="text-sm font-medium">{category.category_name}</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(category.total)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Income Categories */}
            {summary.incomeByCategory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Income by Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary.incomeByCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.category_color }}
                        />
                        <span className="text-sm font-medium">{category.category_name}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(category.total)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionManager;