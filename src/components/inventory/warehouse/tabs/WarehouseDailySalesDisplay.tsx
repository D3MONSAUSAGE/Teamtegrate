import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { useWarehouseSales } from '@/hooks/useWarehouseSales';

interface WarehouseDailySalesDisplayProps {
  warehouseId: string;
}

export const WarehouseDailySalesDisplay: React.FC<WarehouseDailySalesDisplayProps> = ({ warehouseId }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { summary, isLoading } = useWarehouseSales(warehouseId, currentWeek);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleThisWeek = () => setCurrentWeek(new Date());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading sales data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {summary?.invoice_count || 0} invoices this week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleThisWeek}>
            This Week
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary?.total_sales.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary?.collected.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${summary?.outstanding.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash on Hand</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${summary?.cash_on_hand.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From cash/equivalent payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {summary?.daily_breakdown.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium">{format(new Date(day.date), 'EEEE, MMM dd')}</p>
                  <p className="text-xs text-muted-foreground">
                    {day.invoice_count} invoice{day.invoice_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold">${day.total_sales.toFixed(2)}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-600">
                      Paid: ${day.collected.toFixed(2)}
                    </span>
                    {day.outstanding > 0 && (
                      <span className="text-orange-600">
                        Due: ${day.outstanding.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {summary?.daily_breakdown.every(day => day.invoice_count === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No sales recorded for this week
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
