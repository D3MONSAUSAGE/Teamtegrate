import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  CalendarIcon, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  RefreshCw,
  Clock
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RecurringTransaction, TransactionCategory } from '@/types/transactions';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';

interface RecurringTransactionManagerProps {
  categories: TransactionCategory[];
  locations: string[];
}

const RecurringTransactionManager: React.FC<RecurringTransactionManagerProps> = ({
  categories,
  locations
}) => {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'fixed_cost',
    category_id: '',
    amount: '',
    description: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    start_date: new Date(),
    end_date: null as Date | null,
    location: '',
    vendor_name: '',
    is_active: true
  });

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);

  const fetchRecurringTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          category:transaction_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecurringTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching recurring transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load recurring transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNextGenerationDate = (startDate: Date, frequency: string): Date => {
    switch (frequency) {
      case 'daily':
        return addDays(startDate, 1);
      case 'weekly':
        return addWeeks(startDate, 1);
      case 'monthly':
        return addMonths(startDate, 1);
      case 'yearly':
        return addYears(startDate, 1);
      default:
        return addMonths(startDate, 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.amount || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const nextGenDate = calculateNextGenerationDate(formData.start_date, formData.frequency);
      
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: hasEndDate && formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
        next_generation_date: format(nextGenDate, 'yyyy-MM-dd'),
        vendor_name: formData.vendor_name || null,
        location: formData.location || null
      };

      if (editingTransaction) {
        const { data, error } = await supabase
          .from('recurring_transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id)
          .select(`
            *,
            category:transaction_categories(*)
          `)
          .single();

        if (error) throw error;

        setRecurringTransactions(prev => 
          prev.map(rt => rt.id === editingTransaction.id ? data : rt)
        );
        
        toast({
          title: "Success",
          description: "Recurring transaction updated successfully"
        });
      } else {
        const { data, error } = await supabase
          .from('recurring_transactions')
          .insert([transactionData])
          .select(`
            *,
            category:transaction_categories(*)
          `)
          .single();

        if (error) throw error;

        setRecurringTransactions(prev => [data, ...prev]);
        
        toast({
          title: "Success",
          description: "Recurring transaction created successfully"
        });
      }

      resetForm();
    } catch (error: any) {
      console.error('Error saving recurring transaction:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      category_id: '',
      amount: '',
      description: '',
      frequency: 'monthly',
      start_date: new Date(),
      end_date: null,
      location: '',
      vendor_name: '',
      is_active: true
    });
    setHasEndDate(false);
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setFormData({
      type: transaction.type,
      category_id: transaction.category_id,
      amount: transaction.amount.toString(),
      description: transaction.description,
      frequency: transaction.frequency,
      start_date: new Date(transaction.start_date),
      end_date: transaction.end_date ? new Date(transaction.end_date) : null,
      location: transaction.location || '',
      vendor_name: transaction.vendor_name || '',
      is_active: transaction.is_active
    });
    setHasEndDate(!!transaction.end_date);
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setRecurringTransactions(prev => 
        prev.map(rt => rt.id === id ? { ...rt, is_active: !currentStatus } : rt)
      );

      toast({
        title: "Success",
        description: `Recurring transaction ${!currentStatus ? 'activated' : 'paused'}`
      });
    } catch (error: any) {
      console.error('Error toggling transaction:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
      
      toast({
        title: "Success",
        description: "Recurring transaction deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const generateTransactions = async (recurringId: string) => {
    try {
      const recurring = recurringTransactions.find(rt => rt.id === recurringId);
      if (!recurring) throw new Error('Recurring transaction not found');

      // Create a new transaction from the recurring template
      const { error } = await supabase
        .from('transactions')
        .insert([{
          category_id: recurring.category_id,
          type: recurring.type,
          amount: recurring.amount,
          description: `${recurring.description} (Auto-generated)`,
          date: format(new Date(), 'yyyy-MM-dd'),
          location: recurring.location,
          vendor_name: recurring.vendor_name,
          is_recurring: true,
          recurring_template_id: recurring.id
        }]);

      if (error) throw error;

      // Update next generation date
      const nextDate = calculateNextGenerationDate(
        new Date(recurring.next_generation_date || recurring.start_date), 
        recurring.frequency
      );

      await supabase
        .from('recurring_transactions')
        .update({ next_generation_date: format(nextDate, 'yyyy-MM-dd') })
        .eq('id', recurringId);

      toast({
        title: "Success",
        description: "Transaction generated from recurring template"
      });

      fetchRecurringTransactions();
    } catch (error: any) {
      console.error('Error generating transaction:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  // Filter categories by type
  const filteredCategories = categories.filter(cat => 
    formData.type === 'fixed_cost' ? cat.type === 'expense' : cat.type === formData.type
  );

  useEffect(() => {
    fetchRecurringTransactions();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading recurring transactions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Fixed Costs & Recurring Transactions</h3>
          <p className="text-sm text-muted-foreground">
            Set up automatic recurring income, expenses, and fixed costs
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Recurring Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recurringTransactions.filter(rt => rt.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Fixed Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(
                recurringTransactions
                  .filter(rt => rt.is_active && rt.frequency === 'monthly' && (rt.type === 'expense' || rt.type === 'fixed_cost'))
                  .reduce((sum, rt) => sum + rt.amount, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                recurringTransactions
                  .filter(rt => rt.is_active && rt.frequency === 'monthly' && rt.type === 'income')
                  .reduce((sum, rt) => sum + rt.amount, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTransaction ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
            </CardTitle>
            <CardDescription>
              Set up a template that will automatically generate transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'income' | 'expense' | 'fixed_cost') => 
                      setFormData(prev => ({ ...prev, type: value, category_id: '' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Recurring Income</SelectItem>
                      <SelectItem value="expense">Recurring Expense</SelectItem>
                      <SelectItem value="fixed_cost">Fixed Cost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Description and Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => 
                      setFormData(prev => ({ ...prev, frequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.start_date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => {
                          if (date) {
                            setFormData(prev => ({ ...prev, start_date: date }));
                            setStartDateOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch
                      id="hasEndDate"
                      checked={hasEndDate}
                      onCheckedChange={setHasEndDate}
                    />
                    <Label htmlFor="hasEndDate">Set End Date (Optional)</Label>
                  </div>
                  
                  {hasEndDate && (
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, "PPP") : "Select end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => {
                            setFormData(prev => ({ ...prev, end_date: date }));
                            setEndDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific location</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vendor">Vendor/Supplier (Optional)</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor_name: e.target.value }))}
                    placeholder="Enter vendor name"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTransaction ? 'Update' : 'Create'} Recurring Transaction
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recurring Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recurring Transactions</CardTitle>
          <CardDescription>
            {recurringTransactions.length} recurring transaction templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recurringTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recurring transactions found. Create your first one above.
            </div>
          ) : (
            <div className="space-y-4">
              {recurringTransactions.map((transaction) => {
                const category = categories.find(c => c.id === transaction.category_id);
                
                return (
                  <div 
                    key={transaction.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      transaction.is_active ? 'hover:bg-muted/50' : 'opacity-60 bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category?.color || '#6b7280' }}
                          />
                          <Clock className={`w-4 h-4 ${transaction.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{transaction.description}</h4>
                            <Badge variant={transaction.is_active ? 'default' : 'secondary'}>
                              {transaction.is_active ? 'Active' : 'Paused'}
                            </Badge>
                            <Badge variant="outline">
                              {getFrequencyDisplay(transaction.frequency)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {category && <span>{category.name}</span>}
                            <span>Started {format(new Date(transaction.start_date), 'MMM d, yyyy')}</span>
                            {transaction.end_date && (
                              <span>Ends {format(new Date(transaction.end_date), 'MMM d, yyyy')}</span>
                            )}
                            {transaction.location && <span>{transaction.location}</span>}
                          </div>

                          {transaction.next_generation_date && transaction.is_active && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Next: {format(new Date(transaction.next_generation_date), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className={`text-lg font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateTransactions(transaction.id)}
                            disabled={!transaction.is_active}
                            title="Generate transaction now"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(transaction.id, transaction.is_active)}
                            title={transaction.is_active ? 'Pause' : 'Activate'}
                          >
                            {transaction.is_active ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTransaction(transaction.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecurringTransactionManager;