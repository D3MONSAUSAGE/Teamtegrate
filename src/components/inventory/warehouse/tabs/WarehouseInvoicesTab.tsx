import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, FileText, DollarSign, TrendingDown, BarChart3 } from 'lucide-react';
import { SalesInvoicesDisplay } from './SalesInvoicesDisplay';
import { ExpenseInvoicesDisplay } from './ExpenseInvoicesDisplay';
import { WarehouseDailySalesDisplay } from './WarehouseDailySalesDisplay';

interface WarehouseInvoicesTabProps {
  warehouseId: string;
}

export const WarehouseInvoicesTab: React.FC<WarehouseInvoicesTabProps> = ({ warehouseId }) => {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Warehouse Invoices</h2>
          <p className="text-sm text-muted-foreground">
            Track all sales invoices (outgoing) and expense invoices (incoming)
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="daily-sales" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Daily Sales
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Sales Invoices
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Expense Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-sales" className="space-y-4">
          <WarehouseDailySalesDisplay warehouseId={warehouseId} />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <SalesInvoicesDisplay warehouseId={warehouseId} />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseInvoicesDisplay warehouseId={warehouseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
