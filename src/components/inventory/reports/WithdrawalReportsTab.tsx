import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/contexts/inventory';
import { StandardTeamSelector } from '@/components/teams';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, Package, DollarSign, TrendingDown, Trash2, 
  ArrowRightLeft, AlertTriangle, ShoppingCart, FileText, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';

// Withdrawal reason mapping
const WITHDRAWAL_REASON_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'sale': { label: 'Sales', icon: <ShoppingCart className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  'waste': { label: 'Waste/Spoilage', icon: <Trash2 className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  'damage': { label: 'Damaged Goods', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
  'transfer': { label: 'Transfer Out', icon: <ArrowRightLeft className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  'sampling': { label: 'Sampling/Testing', icon: <Package className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  'promotion': { label: 'Promotional Use', icon: <FileText className="h-4 w-4" />, color: 'bg-pink-100 text-pink-800' },
  'other': { label: 'Other', icon: <Package className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' },
};

export const WithdrawalReportsTab: React.FC = () => {
  const { transactions, items, refreshTransactions } = useInventory();
  const { hasRoleAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('30'); // Last 30 days

  // Filter withdrawal transactions (outbound adjustments)
  const withdrawalTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.transaction_type === 'out' || 
      (t.transaction_type === 'adjustment' && t.quantity < 0)
    );
  }, [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return withdrawalTransactions.filter(transaction => {
      const item = items.find(i => i.id === transaction.item_id);
      if (!item) return false;

      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesReason = reasonFilter === 'all' || transaction.notes?.toLowerCase().includes(reasonFilter.toLowerCase());
      
      // Date filtering
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const daysAgo = parseInt(dateFilter);
        const filterDate = new Date();
        filterDate.setDate(filterDate.getDate() - daysAgo);
        matchesDate = new Date(transaction.transaction_date) >= filterDate;
      }
      
      return matchesSearch && matchesReason && matchesDate;
    });
  }, [withdrawalTransactions, items, searchTerm, reasonFilter, dateFilter]);

  // Calculate metrics by reason
  const reasonMetrics = useMemo(() => {
    const metrics: Record<string, { count: number; totalValue: number; totalQuantity: number }> = {};
    
    filteredTransactions.forEach(transaction => {
      const reason = transaction.notes?.toLowerCase() || 'other';
      const reasonKey = reason.includes('sale') ? 'sale' : 
                       reason.includes('waste') ? 'waste' :
                       reason.includes('damage') ? 'damage' :
                       reason.includes('transfer') ? 'transfer' : 'other';
      
      if (!metrics[reasonKey]) {
        metrics[reasonKey] = { count: 0, totalValue: 0, totalQuantity: 0 };
      }
      
      metrics[reasonKey].count++;
      metrics[reasonKey].totalValue += Math.abs(transaction.quantity) * (transaction.unit_cost || 0);
      metrics[reasonKey].totalQuantity += Math.abs(transaction.quantity);
    });
    
    return metrics;
  }, [filteredTransactions]);

  // Sales-specific metrics (profit calculations)
  const salesMetrics = useMemo(() => {
    const salesTransactions = filteredTransactions.filter(t => 
      t.notes?.toLowerCase().includes('sale')
    );
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    salesTransactions.forEach(transaction => {
      const item = items.find(i => i.id === transaction.item_id);
      if (item) {
        const quantity = Math.abs(transaction.quantity);
        const revenue = quantity * (item.sale_price || 0);
        const cost = quantity * (item.unit_cost || 0);
        
        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += revenue - cost;
      }
    });

    return {
      transactions: salesTransactions.length,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    };
  }, [filteredTransactions, items]);

  const getTransactionIcon = (reason: string) => {
    return WITHDRAWAL_REASON_LABELS[reason]?.icon || <Package className="h-4 w-4" />;
  };

  const getTransactionBadge = (reason: string) => {
    const config = WITHDRAWAL_REASON_LABELS[reason] || WITHDRAWAL_REASON_LABELS['other'];
    return (
      <Badge variant="secondary" className={config.color}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Withdrawal & Sales Reports</h3>
          <p className="text-muted-foreground">
            Track inventory withdrawals, sales performance, and loss analysis
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={refreshTransactions}
          className="shrink-0"
        >
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {hasRoleAccess('manager') && (
              <StandardTeamSelector
                selectedTeamId={selectedTeam || null}
                onTeamChange={(teamId) => setSelectedTeam(teamId || '')}
                showAllOption={hasRoleAccess('admin')}
                placeholder="Filter by team"
                variant="simple"
              />
            )}

            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="waste">Waste/Spoilage</SelectItem>
                <SelectItem value="damage">Damaged Goods</SelectItem>
                <SelectItem value="transfer">Transfer Out</SelectItem>
                <SelectItem value="sampling">Sampling/Testing</SelectItem>
                <SelectItem value="promotion">Promotional Use</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
          <TabsTrigger value="losses">Loss Analysis</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                <div className="text-sm text-muted-foreground">
                  {Object.values(reasonMetrics).reduce((sum, m) => sum + m.totalQuantity, 0)} items
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Object.values(reasonMetrics).reduce((sum, m) => sum + m.totalValue, 0))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Withdrawn inventory cost
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground text-green-600">
                  Sales Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesMetrics.totalRevenue)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {salesMetrics.transactions} sales transactions
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground text-green-600">
                  Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesMetrics.totalProfit)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {salesMetrics.profitMargin.toFixed(1)}% margin
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown by Reason */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Breakdown by Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(reasonMetrics).map(([reason, metrics]) => (
                  <div key={reason} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(reason)}
                      <div>
                        <div className="font-medium">{WITHDRAWAL_REASON_LABELS[reason]?.label || reason}</div>
                        <div className="text-sm text-muted-foreground">
                          {metrics.count} transactions • {metrics.totalQuantity} items
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(metrics.totalValue)}</div>
                      {reason === 'sale' && (
                        <div className="text-sm text-green-600">
                          +{formatCurrency(salesMetrics.totalProfit)} profit
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {/* Sales Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesMetrics.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cost of Goods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(salesMetrics.totalCost)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salesMetrics.totalProfit)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {salesMetrics.profitMargin.toFixed(1)}% margin
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="losses" className="space-y-4">
          {/* Loss Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Waste & Spoilage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(reasonMetrics.waste?.totalValue || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reasonMetrics.waste?.totalQuantity || 0} items lost
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Damaged Goods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(reasonMetrics.damage?.totalValue || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reasonMetrics.damage?.totalQuantity || 0} items damaged
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Withdrawal Transactions</CardTitle>
              <div className="text-sm text-muted-foreground">
                {filteredTransactions.length === 0 ? (
                  'No withdrawal transactions found. Sales transactions will appear here once items are withdrawn/sold.'
                ) : (
                  `Showing ${Math.min(50, filteredTransactions.length)} of ${filteredTransactions.length} transactions`
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No Transactions Yet</h4>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    When you withdraw or sell items from the warehouse, those transactions will appear here for tracking and analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.slice(0, 50).map(transaction => {
                    const item = items.find(i => i.id === transaction.item_id);
                    if (!item) return null;

                    const reasonKey = transaction.notes?.toLowerCase().includes('sale') ? 'sale' : 
                                     transaction.notes?.toLowerCase().includes('waste') ? 'waste' :
                                     transaction.notes?.toLowerCase().includes('damage') ? 'damage' :
                                     transaction.notes?.toLowerCase().includes('transfer') ? 'transfer' : 'other';

                    return (
                      <div key={transaction.id} className="border rounded-lg hover:bg-muted/25 transition-colors">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(transaction.transaction_date), 'MMM d, yyyy h:mm a')}
                                {item.sku && ` • SKU: ${item.sku}`}
                              </div>
                              
                              {/* Enhanced transaction details */}
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                {transaction.processor_name && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>Processed by: {transaction.processor_name}</span>
                                  </div>
                                )}
                                {transaction.warehouses?.name && (
                                  <div className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    <span>Warehouse: {transaction.warehouses.name}</span>
                                    {transaction.warehouses.location && (
                                      <span className="text-muted-foreground">({transaction.warehouses.location})</span>
                                    )}
                                  </div>
                                )}
                                {transaction.teams?.name && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>Team: {transaction.teams.name}</span>
                                  </div>
                                )}
                                {transaction.po_number && (
                                  <div className="flex items-center gap-1">
                                    <ShoppingCart className="h-3 w-3" />
                                    <span>PO: {transaction.po_number}</span>
                                  </div>
                                )}
                                {transaction.vendor_name && (
                                  <div className="flex items-center gap-1">
                                    <ShoppingCart className="h-3 w-3" />
                                    <span>Vendor: {transaction.vendor_name}</span>
                                  </div>
                                )}
                                {transaction.reference_number && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    <span>Ref: {transaction.reference_number}</span>
                                  </div>
                                )}
                                {transaction.total_cost && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>Total: {formatCurrency(transaction.total_cost)}</span>
                                  </div>
                                )}
                              </div>
                              
                              {transaction.notes && (
                                <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded max-w-md">
                                  <strong>Notes:</strong> {transaction.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              {getTransactionBadge(reasonKey)}
                              <div className="text-destructive font-medium">
                                -{Math.abs(transaction.quantity)}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Cost: {formatCurrency(Math.abs(transaction.quantity) * (transaction.unit_cost || 0))}
                            </div>
                            {reasonKey === 'sale' && item.sale_price && (
                              <div className="text-xs text-green-600">
                                Revenue: {formatCurrency(Math.abs(transaction.quantity) * item.sale_price)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};