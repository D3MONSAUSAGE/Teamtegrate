
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from '@/hooks/use-mobile';
import ProfitAndLoss from '@/components/finance/ProfitAndLoss';
import DailySalesManager from '@/components/finance/DailySalesManager';
import InvoiceManager from '@/components/finance/InvoiceManager';
import TransactionManager from '@/components/finance/TransactionManager';
import { SalesChannelsManager } from '@/components/finance/sales-channels/SalesChannelsManager';
import { useSalesManager } from '@/hooks/useSalesManager';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';

const FinancePage: React.FC = () => {
  const isMobile = useIsMobile();
  
  
  // Get sales data for locations and week selection
  const {
    selectedWeek,
    selectedLocation,
    locations,
    weeksWithData
  } = useSalesManager();

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-2xl font-bold">Finance Management</h1>

      <Tabs defaultValue="pnl" className="w-full">
        <TabsList className="mb-4 w-full flex justify-between md:justify-start md:w-auto overflow-x-auto">
          <TabsTrigger value="pnl" className="flex-1 md:flex-none">Profit & Loss</TabsTrigger>
          <TabsTrigger value="daily-sales" className="flex-1 md:flex-none">Daily Sales</TabsTrigger>
          <TabsTrigger value="sales-channels" className="flex-1 md:flex-none">Sales Channels</TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 md:flex-none">Invoices</TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 md:flex-none">
            Transactions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pnl" className="space-y-4">
          <ProfitAndLoss />
        </TabsContent>
        <TabsContent value="daily-sales" className="space-y-4">
          <DailySalesManager />
        </TabsContent>
        <TabsContent value="sales-channels" className="space-y-4">
          <SalesChannelsManager />
        </TabsContent>
        <TabsContent value="invoices" className="space-y-4">
          <InvoiceManager />
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <TransactionManager
            selectedWeek={selectedWeek}
            selectedLocation={selectedLocation}
            locations={locations}
          />
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default FinancePage;
