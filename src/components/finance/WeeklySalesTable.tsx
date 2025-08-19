
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { WeeklySalesData } from '@/types/sales';
import { format, addDays } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface WeeklySalesTableProps {
  weeklyData: WeeklySalesData;
  onDeleteDay?: (date: string, location: string) => Promise<void>;
}

const WeeklySalesTable: React.FC<WeeklySalesTableProps> = ({ weeklyData, onDeleteDay }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDailySalesForDay = (dayIndex: number) => {
    const targetDate = addDays(weeklyData.weekStart, dayIndex);
    const target = format(targetDate, 'yyyy-MM-dd');
    const found = weeklyData.dailySales.find(sale => {
      // sale.date is already in 'yyyy-MM-dd' format, no conversion needed
      return sale.date === target;
    });
    return found;
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDeleteDay = async (date: string, location: string) => {
    if (!onDeleteDay) return;
    
    setIsDeleting(true);
    try {
      await onDeleteDay(date, location);
    } catch (error) {
      console.error('Error deleting sales data:', error);
    } finally {
      setIsDeleting(false);
    }
  };

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
                <TableHead className="text-right">Non Cash</TableHead>
                <TableHead className="text-right">Total Cash</TableHead>
                <TableHead className="text-right">Gross Total</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Tax Paid</TableHead>
                <TableHead className="text-right">Tips</TableHead>
                <TableHead className="text-right">Net Sales</TableHead>
                <TableHead className="text-right">Calculated Cash</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Total In-House Cash</TableHead>
                {onDeleteDay && <TableHead className="w-12"></TableHead>}
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
                    <TableCell className="text-right">
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
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(dailySale.expenses || 0) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {dailySale ? formatCurrency(totalInHouseCash) : '-'}
                    </TableCell>
                    {onDeleteDay && (
                      <TableCell>
                        {dailySale && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Sales Data</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete sales data for {day} ({format(addDays(weeklyData.weekStart, index), 'MMM dd, yyyy')}) at {dailySale.location}?
                                  <br /><br />
                                  <strong>Gross Sales:</strong> {formatCurrency(dailySale.grossSales)}
                                  <br />
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDay(dailySale.date, dailySale.location)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              
              {/* Weekly Totals Row */}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell>WEEK TOTAL</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.nonCash)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.totalCash)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.grossTotal)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.discount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.taxPaid)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.tips)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.netSales)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.calculatedCash)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.expenses)}</TableCell>
                <TableCell className="text-right">{formatCurrency(weeklyData.totals.totalInHouseCash)}</TableCell>
                {onDeleteDay && <TableCell></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklySalesTable;
