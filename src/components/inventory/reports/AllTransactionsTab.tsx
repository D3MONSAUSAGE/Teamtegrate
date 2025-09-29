import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/contexts/inventory';
import { StandardTeamSelector } from '@/components/teams';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, Package, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, 
  ArrowDownRight, ArrowRightLeft, Settings, Users, FileText, 
  ShoppingCart, Plus, Minus, Download, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

// Transaction type configuration
const TRANSACTION_TYPES = {
  'in': { 
    label: 'Stock In', 
    icon: <ArrowDownRight className="h-4 w-4" />, 
    color: 'bg-green-100 text-green-800',
    description: 'Inventory received'
  },
  'out': { 
    label: 'Stock Out', 
    icon: <ArrowUpRight className="h-4 w-4" />, 
    color: 'bg-red-100 text-red-800',
    description: 'Inventory withdrawn'
  },
  'adjustment': { 
    label: 'Adjustment', 
    icon: <Settings className="h-4 w-4" />, 
    color: 'bg-blue-100 text-blue-800',
    description: 'Stock level adjustments'
  },
  'count': { 
    label: 'Count', 
    icon: <Package className="h-4 w-4" />, 
    color: 'bg-purple-100 text-purple-800',
    description: 'Inventory counts'
  },
};

export const AllTransactionsTab: React.FC = () => {
  const { transactions, items, refreshTransactions } = useInventory();
  const { hasRoleAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('30'); // Last 30 days
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Apply filters and sorting
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const item = items.find(i => i.id === transaction.item_id);
      if (!item) return false;

      const matchesSearch = searchTerm === '' || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.po_number && transaction.po_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.processor_name && transaction.processor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
      
      const matchesTeam = selectedTeam === '' || transaction.team_id === selectedTeam;
      
      // Date filtering
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const daysAgo = parseInt(dateFilter);
        const filterDate = new Date();
        filterDate.setDate(filterDate.getDate() - daysAgo);
        matchesDate = new Date(transaction.transaction_date) >= filterDate;
      }
      
      return matchesSearch && matchesType && matchesTeam && matchesDate;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
          break;
        case 'value':
          const aValue = Math.abs(a.quantity) * (a.unit_cost || 0);
          const bValue = Math.abs(b.quantity) * (b.unit_cost || 0);
          comparison = aValue - bValue;
          break;
        case 'quantity':
          comparison = Math.abs(a.quantity) - Math.abs(b.quantity);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [transactions, items, searchTerm, typeFilter, selectedTeam, dateFilter, sortBy, sortOrder]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const metrics = {
      totalTransactions: filteredTransactions.length,
      totalValue: 0,
      inTransactions: 0,
      outTransactions: 0,
      adjustments: 0,
      inValue: 0,
      outValue: 0,
    };

    filteredTransactions.forEach(transaction => {
      const value = Math.abs(transaction.quantity) * (transaction.unit_cost || 0);
      metrics.totalValue += value;

      switch (transaction.transaction_type) {
        case 'in':
          metrics.inTransactions++;
          metrics.inValue += value;
          break;
        case 'out':
          metrics.outTransactions++;
          metrics.outValue += value;
          break;
        case 'adjustment':
          metrics.adjustments++;
          break;
        case 'count':
          metrics.adjustments++;
          break;
      }
    });

    return metrics;
  }, [filteredTransactions]);

  // Top items by transaction volume
  const topItems = useMemo(() => {
    const itemStats = new Map<string, { count: number; value: number; name: string; sku?: string }>();
    
    filteredTransactions.forEach(transaction => {
      const item = items.find(i => i.id === transaction.item_id);
      if (!item) return;
      
      const existing = itemStats.get(transaction.item_id) || { count: 0, value: 0, name: item.name, sku: item.sku };
      existing.count++;
      existing.value += Math.abs(transaction.quantity) * (transaction.unit_cost || 0);
      itemStats.set(transaction.item_id, existing);
    });

    return Array.from(itemStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredTransactions, items]);

  const getTransactionTypeBadge = (type: string) => {
    const config = TRANSACTION_TYPES[type as keyof typeof TRANSACTION_TYPES] || {
      label: type,
      icon: <Package className="h-4 w-4" />,
      color: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge variant="secondary" className={config.color}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const getQuantityDisplay = (transaction: any) => {
    const isPositive = transaction.quantity > 0;
    const absQuantity = Math.abs(transaction.quantity);
    
    return (
      <div className={cn(
        "flex items-center gap-1 font-medium",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {isPositive ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
        {absQuantity}
      </div>
    );
  };

  const exportToCSV = () => {
    const headers = [
        'Date', 'Type', 'Item Name', 'SKU', 'Quantity', 'Unit Cost', 'Total Value',
        'PO Number', 'Reference Number', 'Vendor', 'Processor', 'Team', 'Warehouse', 'Notes'
    ];
    
    const csvData = filteredTransactions.map(transaction => {
      const item = items.find(i => i.id === transaction.item_id);
      return [
        format(new Date(transaction.transaction_date), 'yyyy-MM-dd HH:mm:ss'),
        TRANSACTION_TYPES[transaction.transaction_type as keyof typeof TRANSACTION_TYPES]?.label || transaction.transaction_type,
        item?.name || 'Unknown Item',
        item?.sku || '',
        transaction.quantity,
        transaction.unit_cost || 0,
        Math.abs(transaction.quantity) * (transaction.unit_cost || 0),
        transaction.po_number || '',
        transaction.reference_number || '',
        transaction.po_number || '',
        transaction.vendor_name || '',
        transaction.processor_name || '',
        transaction.teams?.name || '',
        transaction.warehouses?.name || '',
        transaction.notes || ''
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Complete Transaction Reports</h3>
          <p className="text-muted-foreground">
            Comprehensive view of all inventory transactions for audit and analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={exportToCSV}
            className="shrink-0"
            disabled={filteredTransactions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline"
            onClick={refreshTransactions}
            className="shrink-0"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items, SKU, lot, processor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
                <SelectItem value="count">Counts</SelectItem>
              </SelectContent>
            </Select>

            {hasRoleAccess('manager') && (
              <StandardTeamSelector
                selectedTeamId={selectedTeam || null}
                onTeamChange={(teamId) => setSelectedTeam(teamId || '')}
                showAllOption={hasRoleAccess('admin')}
                placeholder="Filter by team"
                variant="simple"
              />
            )}

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [sort, order] = value.split('-');
              setSortBy(sort as 'date' | 'value' | 'quantity');
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="value-desc">Value (Highest)</SelectItem>
                <SelectItem value="value-asc">Value (Lowest)</SelectItem>
                <SelectItem value="quantity-desc">Quantity (Highest)</SelectItem>
                <SelectItem value="quantity-asc">Quantity (Lowest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.totalTransactions}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(summaryMetrics.totalValue)} total value
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground text-green-600">
                  Stock In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summaryMetrics.inTransactions}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(summaryMetrics.inValue)} received
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground text-red-600">
                  Stock Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summaryMetrics.outTransactions}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(summaryMetrics.outValue)} withdrawn
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  summaryMetrics.inValue > summaryMetrics.outValue ? "text-green-600" : "text-red-600"
                )}>
                  {summaryMetrics.inTransactions - summaryMetrics.outTransactions}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(summaryMetrics.inValue - summaryMetrics.outValue)} net value
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Type Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(TRANSACTION_TYPES).map(([type, config]) => {
                    const count = type === 'in' ? summaryMetrics.inTransactions :
                                  type === 'out' ? summaryMetrics.outTransactions :
                                  type === 'adjustment' ? summaryMetrics.adjustments :
                                  summaryMetrics.adjustments;
                    
                    return (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {config.icon}
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-sm text-muted-foreground">{config.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{count}</div>
                          <div className="text-sm text-muted-foreground">transactions</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Items by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.sku && (
                            <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{item.count}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {topItems.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No transaction data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <div className="text-sm text-muted-foreground">
                {filteredTransactions.length === 0 ? (
                  'No transactions found with current filters'
                ) : (
                  `Showing ${filteredTransactions.length} transactions`
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No Transactions Found</h4>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No transactions found matching your current filters. Try adjusting the search criteria or date range.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Processor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.slice(0, 100).map((transaction) => {
                        const item = items.find(i => i.id === transaction.item_id);
                        const totalValue = Math.abs(transaction.quantity) * (transaction.unit_cost || 0);
                        
                        return (
                          <TableRow key={transaction.id} className="hover:bg-muted/25">
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(transaction.transaction_date), 'h:mm a')}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getTransactionTypeBadge(transaction.transaction_type)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item?.name || 'Unknown Item'}</div>
                              {item?.sku && (
                                <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                              )}
                              {transaction.po_number && (
                                <div className="text-xs text-muted-foreground">PO: {transaction.po_number}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {getQuantityDisplay(transaction)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(transaction.unit_cost || 0)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(totalValue)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-xs text-muted-foreground max-w-48">
                                {transaction.reference_number && (
                                  <div>Ref: {transaction.reference_number}</div>
                                )}
                                {transaction.po_number && (
                                  <div>PO: {transaction.po_number}</div>
                                )}
                                {transaction.vendor_name && (
                                  <div>Vendor: {transaction.vendor_name}</div>
                                )}
                                {transaction.teams?.name && (
                                  <div>Team: {transaction.teams.name}</div>
                                )}
                                {transaction.warehouses?.name && (
                                  <div>Warehouse: {transaction.warehouses.name}</div>
                                )}
                                {transaction.notes && (
                                  <div className="italic">"{transaction.notes}"</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {transaction.processor_name && (
                                <div className="text-sm">{transaction.processor_name}</div>
                              )}
                              {transaction.processor_email && (
                                <div className="text-xs text-muted-foreground">{transaction.processor_email}</div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {filteredTransactions.length > 100 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Showing first 100 of {filteredTransactions.length} transactions. Use filters to narrow results.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Value Flow Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Inbound Value</span>
                    </div>
                    <span className="font-bold text-green-800">{formatCurrency(summaryMetrics.inValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">Outbound Value</span>
                    </div>
                    <span className="font-bold text-red-800">{formatCurrency(summaryMetrics.outValue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Net Change</span>
                    </div>
                    <span className={cn(
                      "font-bold",
                      summaryMetrics.inValue > summaryMetrics.outValue ? "text-green-800" : "text-red-800"
                    )}>
                      {formatCurrency(summaryMetrics.inValue - summaryMetrics.outValue)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{summaryMetrics.totalTransactions}</div>
                    <div className="text-sm text-muted-foreground">Total Transactions</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold text-green-800">{summaryMetrics.inTransactions}</div>
                      <div className="text-green-600">Inbound</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-semibold text-red-800">{summaryMetrics.outTransactions}</div>
                      <div className="text-red-600">Outbound</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-semibold text-blue-800">{summaryMetrics.adjustments}</div>
                      <div className="text-blue-600">Adjustments</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="font-semibold text-purple-800">{summaryMetrics.adjustments}</div>
                      <div className="text-purple-600">Counts</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};