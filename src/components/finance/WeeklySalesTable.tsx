
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WeeklySalesData } from '@/types/sales';
import { format, startOfWeek, addDays } from 'date-fns';

interface WeeklySalesTableProps {
  weeklyData: WeeklySalesData;
}

const WeeklySalesTable: React.FC<WeeklySalesTableProps> = ({ weeklyData }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDailySalesForDay = (dayIndex: number) => {
    const targetDate = addDays(weeklyData.weekStart, dayIndex);
    return weeklyData.dailySales.find(sale => 
      format(new Date(sale.date), 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd')
    );
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Weekly Sales Report - {weeklyData.location}</span>
          <span className="text-sm text-muted-foreground">
            {format(weeklyData.weekStart, 'MMM dd')} - {format(weeklyData.weekEnd, 'MMM dd, yyyy')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Day</TableHead>
                <TableHead className="font-semibold">File</TableHead>
                <TableHead className="text-right">Non Cash</TableHead>
                <TableHead className="text-right">Total Cash</TableHead>
                <TableHead className="text-right">Gross Total</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right text-destructive">Tax Paid</TableHead>
                <TableHead className="text-right">Tips</TableHead>
                <TableHead className="text-right">Net Sales</TableHead>
                <TableHead className="text-right">Calculated Cash</TableHead>
                <TableHead className="text-right text-destructive">Expenses</TableHead>
                <TableHead className="text-right">Total In-House Cash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((day, index) => {
                const dailySale = getDailySalesForDay(index);
                const totalDiscount = dailySale?.discounts.reduce((sum, discount) => sum + discount.total, 0) || 0;
                const totalTax = dailySale?.taxes.reduce((sum, tax) => sum + tax.total, 0) || 0;
                const totalInHouseCash = (dailySale?.paymentBreakdown.calculatedCash || 0) - (dailySale?.expenses || 0);
                
                return (
                  <TableRow key={day} className={dailySale ? "" : "opacity-50"}>
                    <TableCell className="font-medium">{day}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dailySale?.fileName ? dailySale.fileName.replace(/\.[^/.]+$/, "") : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(dailySale.paymentBreakdown.nonCash) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(dailySale.paymentBreakdown.totalCash) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(dailySale.grossSales) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(totalDiscount) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {dailySale ? formatCurrency(totalTax) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(dailySale.paymentBreakdown.tips) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(dailySale.netSales) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(dailySale.paymentBreakdown.calculatedCash) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {dailySale ? formatCurrency(dailySale.expenses || 0) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(totalInHouseCash) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Weekly Totals Row */}
              <TableRow className="bg-muted/30 font-semibold border-t-2">
                <TableCell className="font-bold">WEEK TOTAL</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.nonCash)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.totalCash)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.grossTotal)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.discount)}</TableCell>
                <TableCell className="text-right text-destructive">{formatCurrency(weeklyData.totals.taxPaid)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.tips)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.netSales)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.calculatedCash)}</TableCell>
                <TableCell className="text-right text-destructive">{formatCurrency(weeklyData.totals.expenses)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(weeklyData.totals.totalInHouseCash)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklySalesTable;
