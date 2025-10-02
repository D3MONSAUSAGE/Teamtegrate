
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
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="flex justify-between items-center">
          <span className="text-xl font-bold">Weekly Sales Report - {weeklyData.location}</span>
          <span className="text-sm font-medium text-muted-foreground bg-background/80 px-3 py-1.5 rounded-md border">
            {format(weeklyData.weekStart, 'MMM dd')} - {format(weeklyData.weekEnd, 'MMM dd, yyyy')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-muted via-muted/80 to-muted hover:from-muted hover:via-muted/80 hover:to-muted border-b-2 border-border">
                <TableHead className="font-bold text-foreground h-12">Day</TableHead>
                <TableHead className="text-right font-bold text-foreground">Non Cash</TableHead>
                <TableHead className="text-right font-bold text-foreground">Total Cash</TableHead>
                <TableHead className="text-right font-bold text-foreground bg-primary/5">Gross Total</TableHead>
                <TableHead className="text-right font-bold text-foreground">Discount</TableHead>
                <TableHead className="text-right font-bold text-foreground">Tax Paid</TableHead>
                <TableHead className="text-right font-bold text-foreground">Tips</TableHead>
                <TableHead className="text-right font-bold text-foreground bg-primary/5">Net Sales</TableHead>
                <TableHead className="text-right font-bold text-foreground">Calculated Cash</TableHead>
                <TableHead className="text-right font-bold text-foreground">Expenses</TableHead>
                <TableHead className="text-right font-bold text-foreground bg-primary/5">In-House Cash</TableHead>
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
                  <TableRow 
                    key={day} 
                    className={`
                      ${dailySale ? "hover:bg-muted/30 transition-colors" : "opacity-50"}
                      ${index % 2 === 0 ? "bg-background" : "bg-muted/10"}
                      border-b border-border/50
                    `}
                  >
                    <TableCell className="font-semibold py-4">{day}</TableCell>
                    <TableCell className="text-right font-mono text-sm py-4">
                      {dailySale ? <span className="text-primary">{formatCurrency(dailySale.paymentBreakdown.nonCash)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm py-4">
                      {dailySale ? <span className="text-primary">{formatCurrency(dailySale.paymentBreakdown.totalCash)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold bg-primary/5 py-4">
                      {dailySale ? <span className="text-primary">{formatCurrency(dailySale.grossSales)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm py-4">
                      {dailySale ? <span className="text-amber-600 dark:text-amber-500">{formatCurrency(totalDiscount)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm py-4">
                      {dailySale ? <span className="text-muted-foreground">{formatCurrency(totalTax)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm py-4">
                      {dailySale ? <span className="text-emerald-600 dark:text-emerald-500">{formatCurrency(dailySale.paymentBreakdown.tips)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold bg-primary/5 py-4">
                      {dailySale ? <span className="text-primary">{formatCurrency(dailySale.netSales)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm py-4">
                      {dailySale ? <span className="text-emerald-600 dark:text-emerald-500">{formatCurrency(dailySale.paymentBreakdown.calculatedCash)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm py-4">
                      {dailySale ? <span className="text-destructive">{formatCurrency(dailySale.expenses || 0)}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold bg-primary/5 py-4">
                      {dailySale ? (
                        <span className={totalInHouseCash >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-destructive"}>
                          {formatCurrency(totalInHouseCash)}
                        </span>
                      ) : '-'}
                    </TableCell>
                    {onDeleteDay && (
                      <TableCell className="py-4">
                        {dailySale && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive transition-colors"
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
              <TableRow className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-t-2 border-primary/20 hover:from-primary/15 hover:via-primary/10 hover:to-primary/15 transition-colors">
                <TableCell className="font-bold text-base py-5">WEEK TOTAL</TableCell>
                <TableCell className="text-right font-mono font-bold py-5 text-primary">{formatCurrency(weeklyData.totals.nonCash)}</TableCell>
                <TableCell className="text-right font-mono font-bold py-5 text-primary">{formatCurrency(weeklyData.totals.totalCash)}</TableCell>
                <TableCell className="text-right font-mono font-bold py-5 bg-primary/10 text-primary text-base">{formatCurrency(weeklyData.totals.grossTotal)}</TableCell>
                <TableCell className="text-right font-mono font-bold py-5 text-amber-600 dark:text-amber-500">{formatCurrency(weeklyData.totals.discount)}</TableCell>
                <TableCell className="text-right font-mono font-bold py-5">{formatCurrency(weeklyData.totals.taxPaid)}</TableCell>
                <TableCell className="text-right font-mono font-bold py-5 text-emerald-600 dark:text-emerald-500">{formatCurrency(weeklyData.totals.tips)}</TableCell>
                <TableCell className="text-right font-mono font-bold py-5 bg-primary/10 text-primary text-base">{formatCurrency(weeklyData.totals.netSales)}</TableCell>
                <TableCell className="text-right font-mono font-bold py-5 text-emerald-600 dark:text-emerald-500">{formatCurrency(weeklyData.totals.calculatedCash)}</TableCell>
                <TableCell className="text-right font-mono font-bold py-5 text-destructive">{formatCurrency(weeklyData.totals.expenses)}</TableCell>
                <TableCell className="text-right font-mono font-bold py-5 bg-primary/10 text-base">
                  <span className={weeklyData.totals.totalInHouseCash >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-destructive"}>
                    {formatCurrency(weeklyData.totals.totalInHouseCash)}
                  </span>
                </TableCell>
                {onDeleteDay && <TableCell className="py-5"></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklySalesTable;
