
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
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const handleExport = (pnl: PnlItem) => {
    // Calculate all totals for the export
    const totalRevenue = Object.values(pnl.data.revenue).reduce((sum, val) => sum + val, 0);
    const totalCogs = Object.values(pnl.data.cogs).reduce((sum, val) => sum + val, 0);
    const grossProfit = totalRevenue - totalCogs;
    
    const totalOperatingExpenses = Object.values(pnl.data.operatingExpenses).reduce((sum, val) => sum + val, 0);
    const operatingProfit = grossProfit - totalOperatingExpenses;
    
    const totalOtherExpenses = Object.values(pnl.data.otherExpenses).reduce((sum, val) => sum + val, 0);
    const netProfit = operatingProfit - totalOtherExpenses;
    
    // Calculate percentages
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Create a more complete CSV with all data
    const rows = [
      ['Profit & Loss Statement', pnl.title],
      ['Period', pnl.period],
      ['Date Generated', pnl.createdAt.toLocaleDateString()],
      [''],
      ['REVENUE', 'Amount', '% of Revenue'],
      ['Food Sales', formatCurrency(pnl.data.revenue.foodSales), `${(totalRevenue > 0 ? (pnl.data.revenue.foodSales / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Beverage Sales', formatCurrency(pnl.data.revenue.beverageSales), `${(totalRevenue > 0 ? (pnl.data.revenue.beverageSales / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Merchandise Sales', formatCurrency(pnl.data.revenue.merchandiseSales), `${(totalRevenue > 0 ? (pnl.data.revenue.merchandiseSales / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Catering/Events', formatCurrency(pnl.data.revenue.cateringEvents), `${(totalRevenue > 0 ? (pnl.data.revenue.cateringEvents / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Other Income', formatCurrency(pnl.data.revenue.otherIncome), `${(totalRevenue > 0 ? (pnl.data.revenue.otherIncome / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Total Revenue', formatCurrency(totalRevenue), '100.0%'],
      [''],
      ['COST OF GOODS SOLD', 'Amount', '% of Revenue'],
      ['Food Costs', formatCurrency(pnl.data.cogs.foodCosts), `${(totalRevenue > 0 ? (pnl.data.cogs.foodCosts / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Beverage Costs', formatCurrency(pnl.data.cogs.beverageCosts), `${(totalRevenue > 0 ? (pnl.data.cogs.beverageCosts / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Merchandise Costs', formatCurrency(pnl.data.cogs.merchandiseCosts), `${(totalRevenue > 0 ? (pnl.data.cogs.merchandiseCosts / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Packaging/Supplies', formatCurrency(pnl.data.cogs.packagingSupplies), `${(totalRevenue > 0 ? (pnl.data.cogs.packagingSupplies / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Total COGS', formatCurrency(totalCogs), `${(totalRevenue > 0 ? (totalCogs / totalRevenue) * 100 : 0).toFixed(1)}%`],
      [''],
      ['GROSS PROFIT', formatCurrency(grossProfit), `${grossProfitMargin.toFixed(1)}%`],
      [''],
      ['OPERATING EXPENSES', 'Amount', '% of Revenue'],
      ['Labor Costs', '', ''],
      ['Wages/Salaries', formatCurrency(pnl.data.operatingExpenses.wagesSalaries), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.wagesSalaries / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Benefits/Payroll Taxes', formatCurrency(pnl.data.operatingExpenses.benefitsPayrollTaxes), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.benefitsPayrollTaxes / totalRevenue) * 100 : 0).toFixed(1)}%`],
      [''],
      ['Facilities', '', ''],
      ['Rent/Lease', formatCurrency(pnl.data.operatingExpenses.rentLease), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.rentLease / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Utilities', formatCurrency(pnl.data.operatingExpenses.utilities), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.utilities / totalRevenue) * 100 : 0).toFixed(1)}%`],
      [''],
      ['Marketing & Franchise', '', ''],
      ['Marketing/Advertising', formatCurrency(pnl.data.operatingExpenses.marketingAdvertising), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.marketingAdvertising / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Royalty Fees', formatCurrency(pnl.data.operatingExpenses.royaltyFees), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.royaltyFees / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Advertising Fees', formatCurrency(pnl.data.operatingExpenses.advertisingFees), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.advertisingFees / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Other Franchise Fees', formatCurrency(pnl.data.operatingExpenses.otherFranchiseFees), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.otherFranchiseFees / totalRevenue) * 100 : 0).toFixed(1)}%`],
      [''],
      ['Other Operating Expenses', '', ''],
      ['Insurance', formatCurrency(pnl.data.operatingExpenses.insurance), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.insurance / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Maintenance/Repairs', formatCurrency(pnl.data.operatingExpenses.maintenanceRepairs), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.maintenanceRepairs / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Non-Food Supplies', formatCurrency(pnl.data.operatingExpenses.nonFoodSupplies), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.nonFoodSupplies / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Technology', formatCurrency(pnl.data.operatingExpenses.technology), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.technology / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Professional Fees', formatCurrency(pnl.data.operatingExpenses.professionalFees), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.professionalFees / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Other Operating Expenses', formatCurrency(pnl.data.operatingExpenses.otherOperatingExpenses), `${(totalRevenue > 0 ? (pnl.data.operatingExpenses.otherOperatingExpenses / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Total Operating Expenses', formatCurrency(totalOperatingExpenses), `${(totalRevenue > 0 ? (totalOperatingExpenses / totalRevenue) * 100 : 0).toFixed(1)}%`],
      [''],
      ['OPERATING PROFIT (EBITDA)', formatCurrency(operatingProfit), `${(totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0).toFixed(1)}%`],
      [''],
      ['OTHER EXPENSES', 'Amount', '% of Revenue'],
      ['Depreciation/Amortization', formatCurrency(pnl.data.otherExpenses.depreciationAmortization), `${(totalRevenue > 0 ? (pnl.data.otherExpenses.depreciationAmortization / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Interest Expense', formatCurrency(pnl.data.otherExpenses.interestExpense), `${(totalRevenue > 0 ? (pnl.data.otherExpenses.interestExpense / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Taxes', formatCurrency(pnl.data.otherExpenses.taxes), `${(totalRevenue > 0 ? (pnl.data.otherExpenses.taxes / totalRevenue) * 100 : 0).toFixed(1)}%`],
      ['Total Other Expenses', formatCurrency(totalOtherExpenses), `${(totalRevenue > 0 ? (totalOtherExpenses / totalRevenue) * 100 : 0).toFixed(1)}%`],
      [''],
      ['NET PROFIT (LOSS)', formatCurrency(netProfit), `${netProfitMargin.toFixed(1)}%`],
    ];
    
    // Add notes if they exist
    if (pnl.data.notes) {
      rows.push(['']);
      rows.push(['Notes']);
      rows.push([pnl.data.notes]);
    }
    
    // Properly escape CSV content and join rows
    const csvContent = rows.map(row => 
      row.map(cell => {
        // Handle commas and quotes in content
        if (cell && typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
