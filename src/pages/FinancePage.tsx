
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from '@/hooks/use-mobile';
import ProfitAndLoss from '@/components/finance/ProfitAndLoss';
import DailySales from '@/components/finance/DailySales';

const FinancePage: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-2xl font-bold">Finance Management</h1>
      
      <Tabs defaultValue="pnl" className="w-full">
        <TabsList className="mb-4 w-full flex justify-between md:justify-start md:w-auto overflow-x-auto">
          <TabsTrigger value="pnl" className="flex-1 md:flex-none">Profit & Loss</TabsTrigger>
          <TabsTrigger value="daily-sales" className="flex-1 md:flex-none">Daily Sales</TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 md:flex-none">Transactions</TabsTrigger>
          <TabsTrigger value="budgets" className="flex-1 md:flex-none">Budgets</TabsTrigger>
        </TabsList>
        <TabsContent value="pnl" className="space-y-4">
          <ProfitAndLoss />
        </TabsContent>
        <TabsContent value="daily-sales" className="space-y-4">
          <DailySales />
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <div className="bg-muted/50 p-8 rounded-lg flex flex-col items-center justify-center">
            <h2 className="text-xl font-medium text-muted-foreground">Transactions Coming Soon</h2>
            <p className="text-muted-foreground">This feature is currently under development.</p>
          </div>
        </TabsContent>
        <TabsContent value="budgets" className="space-y-4">
          <div className="bg-muted/50 p-8 rounded-lg flex flex-col items-center justify-center">
            <h2 className="text-xl font-medium text-muted-foreground">Budgets Coming Soon</h2>
            <p className="text-muted-foreground">This feature is currently under development.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancePage;
