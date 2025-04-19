import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, FileDown, Plus } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import PnlForm from './PnlForm';
import PnlView from './PnlView';
import './pnl-print.css';

export interface PnlItem {
  id: string;
  title: string;
  period: string;
  data: PnlData;
  createdAt: Date;
}

export interface PnlData {
  revenue: {
    foodSales: number;
    beverageSales: number;
    merchandiseSales: number;
    cateringEvents: number;
    otherIncome: number;
  };
  cogs: {
    foodCosts: number;
    beverageCosts: number;
    merchandiseCosts: number;
    packagingSupplies: number;
  };
  operatingExpenses: {
    wagesSalaries: number;
    benefitsPayrollTaxes: number;
    rentLease: number;
    utilities: number;
    marketingAdvertising: number;
    royaltyFees: number;
    advertisingFees: number;
    otherFranchiseFees: number;
    insurance: number;
    maintenanceRepairs: number;
    nonFoodSupplies: number;
    technology: number;
    professionalFees: number;
    otherOperatingExpenses: number;
  };
  otherExpenses: {
    depreciationAmortization: number;
    interestExpense: number;
    taxes: number;
  };
  notes: string;
}

const ProfitAndLoss: React.FC = () => {
  const [pnls, setPnls] = useState<PnlItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [viewPnl, setViewPnl] = useState<PnlItem | null>(null);
  
  const handleCreatePnl = (newPnl: PnlItem) => {
    setPnls([...pnls, newPnl]);
    setIsCreating(false);
    toast.success('P&L statement created successfully!');
  };
  
  const handlePrint = (pnl: PnlItem) => {
    setViewPnl(pnl);
    setTimeout(() => {
      window.print();
    }, 100);
  };
  
  const handleExport = (pnl: PnlItem) => {
    // Create CSV content
    const rows = [
      ['Profit & Loss Statement', pnl.title],
      ['Period', pnl.period],
      [''],
      ['REVENUE', ''],
      ['Food Sales', `$${pnl.data.revenue.foodSales.toFixed(2)}`],
      ['Beverage Sales', `$${pnl.data.revenue.beverageSales.toFixed(2)}`],
      ['Merchandise Sales', `$${pnl.data.revenue.merchandiseSales.toFixed(2)}`],
      ['Catering/Events', `$${pnl.data.revenue.cateringEvents.toFixed(2)}`],
      ['Other Income', `$${pnl.data.revenue.otherIncome.toFixed(2)}`],
      ['Total Revenue', `$${Object.values(pnl.data.revenue).reduce((sum, val) => sum + val, 0).toFixed(2)}`],
      [''],
      ['COST OF GOODS SOLD', ''],
      // ... continue with all P&L entries
    ];
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pnl.title.replace(/\s+/g, '_')}_PnL.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('P&L exported successfully!');
  };

  return (
    <div className="space-y-4 print:m-0 print:p-0">
      {viewPnl && (
        <div className="hidden print:block">
          <PnlView pnl={viewPnl} printMode={true} />
        </div>
      )}
      
      <div className="print:hidden">
        {isCreating ? (
          <Card>
            <CardHeader>
              <CardTitle>Create P&L Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <PnlForm onSubmit={handleCreatePnl} onCancel={() => setIsCreating(false)} />
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-end">
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create New P&L
            </Button>
          </div>
        )}
        
        {pnls.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mt-6">P&L Statements</h3>
            {pnls.map((pnl) => (
              <Card key={pnl.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>{pnl.title}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePrint(pnl)}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport(pnl)}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{pnl.period}</p>
                </CardHeader>
                <CardContent>
                  <PnlView pnl={pnl} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !isCreating && (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <h3 className="text-lg font-medium">No P&L Statements Yet</h3>
                <p className="text-muted-foreground text-center my-2">
                  Create your first P&L statement to track your financial performance
                </p>
                <Button onClick={() => setIsCreating(true)} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Create New P&L
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
};

export default ProfitAndLoss;
