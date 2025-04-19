
import React from 'react';
import { PnlItem } from './ProfitAndLoss';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PnlViewProps {
  pnl: PnlItem;
  printMode?: boolean;
}

const PnlView: React.FC<PnlViewProps> = ({ pnl, printMode = false }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Calculate totals
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

  const TableRow = ({ label, value, isSubheader = false, isBold = false, isTotal = false, percentage = null }: { 
    label: string;
    value: string | number;
    isSubheader?: boolean;
    isBold?: boolean;
    isTotal?: boolean;
    percentage?: number | null;
  }) => (
    <div className={`
      flex justify-between py-1 
      ${isSubheader ? 'pl-4' : ''} 
      ${isBold || isTotal ? 'font-medium' : ''} 
      ${isTotal ? 'text-lg mt-1 border-t border-gray-200 pt-2' : ''}
    `}>
      <span>{label}</span>
      <div className="flex space-x-4">
        {percentage !== null && (
          <span className="text-gray-500 w-16 text-right">
            {percentage.toFixed(1)}%
          </span>
        )}
        <span className="text-right w-24">{typeof value === 'number' ? formatCurrency(value) : value}</span>
      </div>
    </div>
  );

  return (
    <div className={printMode ? "p-6 max-w-4xl mx-auto" : ""}>
      {printMode && (
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{pnl.title}</h1>
          <p className="text-gray-600">Period: {pnl.period}</p>
          <p className="text-gray-500 text-sm mt-1">Generated on {pnl.createdAt.toLocaleDateString()}</p>
        </div>
      )}

      <Card className={printMode ? "border-none shadow-none" : ""}>
        <CardContent className={printMode ? "p-0" : "p-6"}>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Revenue</h3>
              <TableRow label="Food Sales" value={pnl.data.revenue.foodSales} 
                percentage={totalRevenue > 0 ? (pnl.data.revenue.foodSales / totalRevenue) * 100 : 0} />
              <TableRow label="Beverage Sales" value={pnl.data.revenue.beverageSales} 
                percentage={totalRevenue > 0 ? (pnl.data.revenue.beverageSales / totalRevenue) * 100 : 0} />
              <TableRow label="Merchandise Sales" value={pnl.data.revenue.merchandiseSales} 
                percentage={totalRevenue > 0 ? (pnl.data.revenue.merchandiseSales / totalRevenue) * 100 : 0} />
              <TableRow label="Catering/Events" value={pnl.data.revenue.cateringEvents} 
                percentage={totalRevenue > 0 ? (pnl.data.revenue.cateringEvents / totalRevenue) * 100 : 0} />
              <TableRow label="Other Income" value={pnl.data.revenue.otherIncome} 
                percentage={totalRevenue > 0 ? (pnl.data.revenue.otherIncome / totalRevenue) * 100 : 0} />
              <TableRow label="Total Revenue" value={totalRevenue} isTotal={true} percentage={100} />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Cost of Goods Sold</h3>
              <TableRow label="Food Costs" value={pnl.data.cogs.foodCosts} 
                percentage={totalRevenue > 0 ? (pnl.data.cogs.foodCosts / totalRevenue) * 100 : 0} />
              <TableRow label="Beverage Costs" value={pnl.data.cogs.beverageCosts} 
                percentage={totalRevenue > 0 ? (pnl.data.cogs.beverageCosts / totalRevenue) * 100 : 0} />
              <TableRow label="Merchandise Costs" value={pnl.data.cogs.merchandiseCosts} 
                percentage={totalRevenue > 0 ? (pnl.data.cogs.merchandiseCosts / totalRevenue) * 100 : 0} />
              <TableRow label="Packaging/Supplies" value={pnl.data.cogs.packagingSupplies} 
                percentage={totalRevenue > 0 ? (pnl.data.cogs.packagingSupplies / totalRevenue) * 100 : 0} />
              <TableRow label="Total COGS" value={totalCogs} isTotal={true} 
                percentage={totalRevenue > 0 ? (totalCogs / totalRevenue) * 100 : 0} />
            </div>

            <div className="bg-muted/30 p-4 rounded-md">
              <TableRow label="Gross Profit" value={grossProfit} isBold={true} 
                percentage={grossProfitMargin} />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Operating Expenses</h3>
              
              <div className="mb-2">
                <p className="font-medium">Labor Costs</p>
                <TableRow 
                  label="Wages/Salaries" 
                  value={pnl.data.operatingExpenses.wagesSalaries} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.wagesSalaries / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Benefits/Payroll Taxes" 
                  value={pnl.data.operatingExpenses.benefitsPayrollTaxes} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.benefitsPayrollTaxes / totalRevenue) * 100 : 0} 
                />
              </div>

              <div className="mb-2">
                <p className="font-medium">Facilities</p>
                <TableRow 
                  label="Rent/Lease" 
                  value={pnl.data.operatingExpenses.rentLease} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.rentLease / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Utilities" 
                  value={pnl.data.operatingExpenses.utilities} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.utilities / totalRevenue) * 100 : 0} 
                />
              </div>

              <div className="mb-2">
                <p className="font-medium">Marketing & Franchise</p>
                <TableRow 
                  label="Marketing/Advertising" 
                  value={pnl.data.operatingExpenses.marketingAdvertising} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.marketingAdvertising / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Royalty Fees" 
                  value={pnl.data.operatingExpenses.royaltyFees} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.royaltyFees / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Advertising Fees" 
                  value={pnl.data.operatingExpenses.advertisingFees} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.advertisingFees / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Other Franchise Fees" 
                  value={pnl.data.operatingExpenses.otherFranchiseFees} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.otherFranchiseFees / totalRevenue) * 100 : 0} 
                />
              </div>

              <div className="mb-2">
                <p className="font-medium">Other Operating Expenses</p>
                <TableRow 
                  label="Insurance" 
                  value={pnl.data.operatingExpenses.insurance} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.insurance / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Maintenance/Repairs" 
                  value={pnl.data.operatingExpenses.maintenanceRepairs} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.maintenanceRepairs / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Non-Food Supplies" 
                  value={pnl.data.operatingExpenses.nonFoodSupplies} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.nonFoodSupplies / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Technology" 
                  value={pnl.data.operatingExpenses.technology} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.technology / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Professional Fees" 
                  value={pnl.data.operatingExpenses.professionalFees} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.professionalFees / totalRevenue) * 100 : 0} 
                />
                <TableRow 
                  label="Other Operating Expenses" 
                  value={pnl.data.operatingExpenses.otherOperatingExpenses} 
                  isSubheader={true}
                  percentage={totalRevenue > 0 ? (pnl.data.operatingExpenses.otherOperatingExpenses / totalRevenue) * 100 : 0} 
                />
              </div>
              
              <TableRow 
                label="Total Operating Expenses" 
                value={totalOperatingExpenses} 
                isTotal={true}
                percentage={totalRevenue > 0 ? (totalOperatingExpenses / totalRevenue) * 100 : 0} 
              />
            </div>

            <div className="bg-muted/30 p-4 rounded-md">
              <TableRow 
                label="Operating Profit (EBITDA)" 
                value={operatingProfit} 
                isBold={true}
                percentage={totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0} 
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Other Expenses</h3>
              <TableRow 
                label="Depreciation/Amortization" 
                value={pnl.data.otherExpenses.depreciationAmortization}
                percentage={totalRevenue > 0 ? (pnl.data.otherExpenses.depreciationAmortization / totalRevenue) * 100 : 0} 
              />
              <TableRow 
                label="Interest Expense" 
                value={pnl.data.otherExpenses.interestExpense}
                percentage={totalRevenue > 0 ? (pnl.data.otherExpenses.interestExpense / totalRevenue) * 100 : 0} 
              />
              <TableRow 
                label="Taxes" 
                value={pnl.data.otherExpenses.taxes}
                percentage={totalRevenue > 0 ? (pnl.data.otherExpenses.taxes / totalRevenue) * 100 : 0} 
              />
              <TableRow 
                label="Total Other Expenses" 
                value={totalOtherExpenses} 
                isTotal={true}
                percentage={totalRevenue > 0 ? (totalOtherExpenses / totalRevenue) * 100 : 0} 
              />
            </div>

            <div className="bg-primary/10 p-4 rounded-md">
              <TableRow 
                label="Net Profit (Loss)" 
                value={netProfit} 
                isBold={true}
                percentage={netProfitMargin} 
              />
            </div>

            {pnl.data.notes && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{pnl.data.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PnlView;
