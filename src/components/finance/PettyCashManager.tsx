import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Wallet, CreditCard, AlertTriangle, DollarSign } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PettyCashBox, PettyCashTransaction } from '@/types/transactions';
import { format } from 'date-fns';

interface PettyCashManagerProps {
  teams: Array<{id: string; name: string}>;
}

const PettyCashManager: React.FC<PettyCashManagerProps> = ({ teams }) => {
  const [cashBoxes, setCashBoxes] = useState<PettyCashBox[]>([]);
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBoxForm, setShowNewBoxForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string>('');
  
  const { toast } = useToast();

  const [newBoxForm, setNewBoxForm] = useState({
    name: '',
    team_id: '',
    initial_amount: ''
  });

  const [newTransactionForm, setNewTransactionForm] = useState({
    petty_cash_box_id: '',
    type: 'expense' as 'expense' | 'replenishment',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchCashBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('petty_cash_boxes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCashBoxes(data || []);
    } catch (error: any) {
      console.error('Error fetching cash boxes:', error);
      toast({
        title: "Error",
        description: "Failed to load petty cash boxes",
        variant: "destructive"
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('petty_cash_transactions')
        .select(`
          *,
          petty_cash_box:petty_cash_boxes(*)
        `)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions((data as any[]) || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    }
  };

  const createCashBox = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBoxForm.name || !newBoxForm.team_id || !newBoxForm.initial_amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const initialAmount = parseFloat(newBoxForm.initial_amount);
      
      const { data, error } = await supabase
        .from('petty_cash_boxes')
        .insert({
          name: newBoxForm.name,
          team_id: newBoxForm.team_id,
          initial_amount: initialAmount,
          current_balance: initialAmount
        } as any)
        .select()
        .single();

      if (error) throw error;

      setCashBoxes(prev => [data, ...prev]);
      setNewBoxForm({ name: '', team_id: '', initial_amount: '' });
      setShowNewBoxForm(false);
      
      toast({
        title: "Success",
        description: "Petty cash box created successfully"
      });
    } catch (error: any) {
      console.error('Error creating cash box:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTransactionForm.petty_cash_box_id || !newTransactionForm.amount || !newTransactionForm.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const amount = parseFloat(newTransactionForm.amount);
      const cashBox = cashBoxes.find(box => box.id === newTransactionForm.petty_cash_box_id);
      
      if (!cashBox) {
        throw new Error('Selected cash box not found');
      }

      // Calculate new balance
      const newBalance = newTransactionForm.type === 'expense' 
        ? cashBox.current_balance - amount 
        : cashBox.current_balance + amount;

      if (newBalance < 0 && newTransactionForm.type === 'expense') {
        toast({
          title: "Error",
          description: "Insufficient funds in petty cash box",
          variant: "destructive"
        });
        return;
      }

      // Add transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('petty_cash_transactions')
        .insert({
          petty_cash_box_id: newTransactionForm.petty_cash_box_id,
          type: newTransactionForm.type,
          amount,
          description: newTransactionForm.description,
          date: newTransactionForm.date
        } as any)
        .select(`
          *,
          petty_cash_box:petty_cash_boxes(*)
        `)
        .single();

      if (transactionError) throw transactionError;

      // Update cash box balance
      const { error: updateError } = await supabase
        .from('petty_cash_boxes')
        .update({ current_balance: newBalance })
        .eq('id', newTransactionForm.petty_cash_box_id);

      if (updateError) throw updateError;

      // Update local state
      setTransactions(prev => [transactionData as any, ...prev]);
      setCashBoxes(prev => prev.map(box => 
        box.id === newTransactionForm.petty_cash_box_id 
          ? { ...box, current_balance: newBalance }
          : box
      ));

      setNewTransactionForm({
        petty_cash_box_id: '',
        type: 'expense',
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
      setShowTransactionForm(false);
      
      toast({
        title: "Success",
        description: `${newTransactionForm.type === 'expense' ? 'Expense' : 'Replenishment'} recorded successfully`
      });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
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

  const getBoxStatus = (box: PettyCashBox) => {
    const percentRemaining = (box.current_balance / box.initial_amount) * 100;
    
    if (percentRemaining <= 20) {
      return { status: 'critical', color: 'text-red-600', icon: AlertTriangle };
    } else if (percentRemaining <= 50) {
      return { status: 'low', color: 'text-yellow-600', icon: AlertTriangle };
    } else {
      return { status: 'good', color: 'text-green-600', icon: Wallet };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCashBoxes(), fetchTransactions()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const filteredTransactions = selectedBoxId && selectedBoxId !== 'all'
    ? transactions.filter(t => t.petty_cash_box_id === selectedBoxId)
    : transactions;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading petty cash data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="manage">Manage Boxes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Boxes</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cashBoxes.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(cashBoxes.reduce((sum, box) => sum + box.current_balance, 0))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Boxes Need Attention</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {cashBoxes.filter(box => (box.current_balance / box.initial_amount) <= 0.2).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Boxes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashBoxes.map((box) => {
              const { status, color, icon: StatusIcon } = getBoxStatus(box);
              const percentRemaining = (box.current_balance / box.initial_amount) * 100;
              
              return (
                <Card key={box.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{box.name}</CardTitle>
                      <StatusIcon className={`w-5 h-5 ${color}`} />
                    </div>
                    <CardDescription>{box.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Balance</span>
                        <span className={`font-bold ${color}`}>
                          {formatCurrency(box.current_balance)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Initial Amount</span>
                        <span>{formatCurrency(box.initial_amount)}</span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            percentRemaining <= 20 ? 'bg-red-600' :
                            percentRemaining <= 50 ? 'bg-yellow-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.max(0, percentRemaining)}%` }}
                        />
                      </div>
                      
                      <div className="text-xs text-muted-foreground text-center">
                        {percentRemaining.toFixed(1)}% remaining
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Petty Cash Transactions</h3>
              <p className="text-sm text-muted-foreground">
                Track expenses and replenishments
              </p>
            </div>
            <Button onClick={() => setShowTransactionForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          {/* Filter */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex gap-4 items-center">
                <Label htmlFor="boxFilter">Filter by Cash Box:</Label>
                <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="All cash boxes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cash boxes</SelectItem>
                    {cashBoxes.map((box) => (
                      <SelectItem key={box.id} value={box.id}>
                        {box.name} - {box.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Transaction Form */}
          {showTransactionForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add Transaction</CardTitle>
                <CardDescription>Record an expense or replenishment</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={addTransaction} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cashBox">Cash Box</Label>
                      <Select
                        value={newTransactionForm.petty_cash_box_id}
                        onValueChange={(value) => 
                          setNewTransactionForm(prev => ({ ...prev, petty_cash_box_id: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cash box" />
                        </SelectTrigger>
                        <SelectContent>
                          {cashBoxes.map((box) => (
                            <SelectItem key={box.id} value={box.id}>
                              {box.name} - {box.location} ({formatCurrency(box.current_balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={newTransactionForm.type}
                        onValueChange={(value: 'expense' | 'replenishment') => 
                          setNewTransactionForm(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="replenishment">Replenishment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={newTransactionForm.amount}
                        onChange={(e) => 
                          setNewTransactionForm(prev => ({ ...prev, amount: e.target.value }))
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newTransactionForm.date}
                        onChange={(e) => 
                          setNewTransactionForm(prev => ({ ...prev, date: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTransactionForm.description}
                      onChange={(e) => 
                        setNewTransactionForm(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Enter transaction description"
                      required
                    />
                  </div>

                  <div className="flex gap-4 justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowTransactionForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Transaction</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Transactions List */}
          <Card>
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found.
                </div>
              ) : (
                <div className="divide-y">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={transaction.type === 'expense' ? 'destructive' : 'default'}>
                            {transaction.type === 'expense' ? 'Expense' : 'Replenishment'}
                          </Badge>
                          <span className="font-medium">{transaction.description}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.petty_cash_box?.name} • {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Manage Cash Boxes</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage petty cash boxes by location
              </p>
            </div>
            <Button onClick={() => setShowNewBoxForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Cash Box
            </Button>
          </div>

          {/* New Cash Box Form */}
          {showNewBoxForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Cash Box</CardTitle>
                <CardDescription>Set up a new petty cash box for a location</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createCashBox} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Cash Box Name</Label>
                      <Input
                        id="name"
                        value={newBoxForm.name}
                        onChange={(e) => setNewBoxForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Main Counter, Kitchen"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="team">Team</Label>
                      <Select
                        value={newBoxForm.team_id}
                        onValueChange={(value) => setNewBoxForm(prev => ({ ...prev, team_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="initialAmount">Initial Amount ($)</Label>
                    <Input
                      id="initialAmount"
                      type="number"
                      step="0.01"
                      value={newBoxForm.initial_amount}
                      onChange={(e) => setNewBoxForm(prev => ({ ...prev, initial_amount: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="flex gap-4 justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowNewBoxForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Cash Box</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Cash Boxes List */}
          <div className="grid grid-cols-1 gap-4">
            {cashBoxes.map((box) => {
              const { color } = getBoxStatus(box);
              
              return (
                <Card key={box.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{box.name}</h4>
                        <p className="text-sm text-muted-foreground">{box.location}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {format(new Date(box.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${color}`}>
                          {formatCurrency(box.current_balance)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          of {formatCurrency(box.initial_amount)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PettyCashManager;