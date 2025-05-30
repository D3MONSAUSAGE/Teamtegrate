
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from '@/hooks/use-mobile';
import ProfitAndLoss from '@/components/finance/ProfitAndLoss';
import DailySales from '@/components/finance/DailySales';
import BranchBudgets from '@/components/finance/BranchBudgets/BranchBudgets';
import InvoiceManager from '@/components/finance/InvoiceManager';
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
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-2xl font-bold">Finance Management</h1>

      <Tabs defaultValue="pnl" className="w-full">
        <TabsList className="mb-4 w-full flex justify-between md:justify-start md:w-auto overflow-x-auto">
          <TabsTrigger value="pnl" className="flex-1 md:flex-none">Profit & Loss</TabsTrigger>
          <TabsTrigger value="daily-sales" className="flex-1 md:flex-none">Daily Sales</TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 md:flex-none">Invoices</TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 md:flex-none" onClick={() => setTransactionsOpen(true)}>
            Transactions
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex-1 md:flex-none">Budgets</TabsTrigger>
        </TabsList>
        <TabsContent value="pnl" className="space-y-4">
          <ProfitAndLoss />
        </TabsContent>
        <TabsContent value="daily-sales" className="space-y-4">
          <DailySales />
        </TabsContent>
        <TabsContent value="invoices" className="space-y-4">
          <InvoiceManager />
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <div className="bg-muted/50 p-8 rounded-lg flex flex-col items-center justify-center">
            <h2 className="text-xl font-medium text-muted-foreground">Transactions Coming Soon</h2>
            <p className="text-muted-foreground">This feature is currently under development.</p>
            <Button onClick={() => setTransactionsOpen(true)} className="mt-4">
              Open Transactions Preview
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="budgets" className="space-y-4">
          <BranchBudgets />
        </TabsContent>
      </Tabs>

      {/* Transactions Drawer */}
      <Drawer open={transactionsOpen} onOpenChange={setTransactionsOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Transactions</DrawerTitle>
              <DrawerDescription>
                A comprehensive view of financial transactions.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <div className="flex flex-col space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">Transaction #{i+1}</div>
                      <div className="text-sm text-muted-foreground">April {15 + i}, 2025</div>
                    </div>
                    <div className={`text-${i % 2 === 0 ? 'green' : 'red'}-600 font-medium`}>
                      {i % 2 === 0 ? '+' : '-'}${(123 * (i + 1)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DrawerFooter>
              <Button>View All Transactions</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default FinancePage;
