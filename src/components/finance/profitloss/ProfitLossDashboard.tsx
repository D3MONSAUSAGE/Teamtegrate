import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfitLoss } from '@/hooks/useProfitLoss';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function ProfitLossDashboard() {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  const { data: plData, isLoading } = useProfitLoss(startDate, endDate);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!plData) return null;

  const isPositive = (value: number) => value >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profit & Loss Statement</h2>
          <p className="text-muted-foreground">
            Financial performance overview
          </p>
        </div>
        <div className="flex gap-4 items-end">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={format(startDate, 'yyyy-MM-dd')}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className="w-40"
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={format(endDate, 'yyyy-MM-dd')}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              className="w-40"
            />
          </div>
          <Button variant="outline">Export PDF</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net Sales</CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(plData.revenue.netSales)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Gross Profit</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {formatCurrency(plData.grossProfit.amount)}
              <span className="text-sm text-muted-foreground">
                ({formatPercentage(plData.grossProfit.margin)})
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Operating Income</CardDescription>
            <CardTitle className={`text-3xl flex items-center gap-2 ${isPositive(plData.operatingIncome.amount) ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive(plData.operatingIncome.amount) ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )}
              {formatCurrency(plData.operatingIncome.amount)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Net Income</CardDescription>
            <CardTitle className={`text-3xl ${isPositive(plData.netIncome.amount) ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(plData.netIncome.amount)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Prime Cost */}
      <Card>
        <CardHeader>
          <CardTitle>Prime Cost Analysis</CardTitle>
          <CardDescription>
            Combined COGS + Labor (Target: &lt; 60%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Prime Cost</span>
              <span className="font-bold">
                {formatCurrency(plData.primeCost.amount)} ({formatPercentage(plData.primeCost.percentage)})
              </span>
            </div>
            <Progress
              value={plData.primeCost.percentage}
              className={`h-3 ${plData.primeCost.percentage > 60 ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">COGS</p>
              <p className="text-2xl font-bold">{formatCurrency(plData.cogs.total)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Labor Costs</p>
              <p className="text-2xl font-bold">{formatCurrency(plData.laborCosts.total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed P&L */}
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Revenue Section */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-lg border-b pb-2">
                <span>Revenue</span>
                <span>{formatCurrency(plData.revenue.netSales)}</span>
              </div>
            </div>

            {/* COGS Section */}
            <div className="space-y-2">
              <div className="flex justify-between font-semibold text-muted-foreground">
                <span>Cost of Goods Sold</span>
                <span>{formatCurrency(plData.cogs.total)}</span>
              </div>
              {plData.cogs.byCategory.map(item => (
                <div key={item.category} className="flex justify-between text-sm pl-4">
                  <span>{item.category}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between font-bold text-lg border-y py-2">
              <span>Gross Profit</span>
              <span className="text-green-600">
                {formatCurrency(plData.grossProfit.amount)} ({formatPercentage(plData.grossProfit.margin)})
              </span>
            </div>

            {/* Operating Expenses */}
            <div className="space-y-2">
              <div className="flex justify-between font-semibold text-muted-foreground">
                <span>Operating Expenses</span>
                <span>{formatCurrency(plData.operatingExpenses.total)}</span>
              </div>
              {plData.operatingExpenses.byCategory.map(item => (
                <div key={item.category} className="flex justify-between text-sm pl-4">
                  <span>{item.category}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pl-4 font-medium">
                <span>Labor Costs</span>
                <span>{formatCurrency(plData.laborCosts.total)}</span>
              </div>
            </div>

            {/* Operating Income */}
            <div className="flex justify-between font-bold text-lg border-y py-2">
              <span>Operating Income</span>
              <span className={isPositive(plData.operatingIncome.amount) ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(plData.operatingIncome.amount)} ({formatPercentage(plData.operatingIncome.margin)})
              </span>
            </div>

            {/* Net Income */}
            <div className="flex justify-between font-bold text-xl border-t-2 pt-4">
              <span>Net Income</span>
              <span className={isPositive(plData.netIncome.amount) ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(plData.netIncome.amount)} ({formatPercentage(plData.netIncome.margin)})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
