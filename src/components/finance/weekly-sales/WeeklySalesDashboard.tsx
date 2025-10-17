import React, { useState } from 'react';
import { startOfWeek, endOfWeek, format, subWeeks, addWeeks } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useWeeklySales } from '@/hooks/useWeeklySales';
import { Badge } from '@/components/ui/badge';

export const WeeklySalesDashboard: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  
  const { summary, cashSummary, isLoading } = useWeeklySales(weekStart, weekEnd);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const stats = [
    {
      title: 'Total Sales',
      value: `$${summary?.total_sales?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      description: `${summary?.total_invoices || 0} invoices`,
      trend: 'positive'
    },
    {
      title: 'Collected',
      value: `$${summary?.total_collected?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      description: `${summary?.paid_count || 0} paid invoices`,
      trend: 'positive'
    },
    {
      title: 'Pending',
      value: `$${summary?.pending_invoices_total?.toFixed(2) || '0.00'}`,
      icon: Clock,
      description: `${summary?.pending_count || 0} invoices`,
      trend: 'neutral'
    },
    {
      title: 'Overdue',
      value: `$${summary?.overdue_invoices_total?.toFixed(2) || '0.00'}`,
      icon: AlertCircle,
      description: `${summary?.overdue_count || 0} invoices`,
      trend: 'negative'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Week Navigator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Sales Overview</CardTitle>
              <CardDescription>
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cash on Hand */}
      <Card>
        <CardHeader>
          <CardTitle>Cash on Hand</CardTitle>
          <CardDescription>
            Cash and cash-equivalent payments received this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">
                  ${cashSummary?.cash_collected?.toFixed(2) || '0.00'}
                </div>
                <p className="text-sm text-muted-foreground">
                  From {cashSummary?.payment_count || 0} cash payments
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {((cashSummary?.cash_collected || 0) / (summary?.total_collected || 1) * 100).toFixed(0)}%
                <span className="text-xs ml-1">of total</span>
              </Badge>
            </div>

            {cashSummary?.payment_methods_used && cashSummary.payment_methods_used.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Payment methods used:</p>
                <div className="flex flex-wrap gap-2">
                  {cashSummary.payment_methods_used.map((method, idx) => (
                    <Badge key={idx} variant="outline">{method}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Balance Info */}
      {summary && summary.total_outstanding > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-900">Outstanding Balance</CardTitle>
            <CardDescription className="text-orange-700">
              Money still owed to your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              ${summary.total_outstanding.toFixed(2)}
            </div>
            <p className="text-sm text-orange-700 mt-2">
              This amount should be collected to match your sales total
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};