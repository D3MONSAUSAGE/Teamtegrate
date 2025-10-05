import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Invoice } from '@/types/invoice';

interface InvoiceSummaryStatsProps {
  invoices: Invoice[];
}

const InvoiceSummaryStats: React.FC<InvoiceSummaryStatsProps> = ({ invoices }) => {
  const totalInvoices = invoices.length;
  
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.invoice_total || 0), 0);
  
  const unpaidAmount = invoices
    .filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partial')
    .reduce((sum, inv) => {
      const remaining = (inv.invoice_total || 0) - (inv.paid_amount || 0);
      return sum + remaining;
    }, 0);
  
  const overdueCount = invoices.filter(inv => {
    if (inv.payment_status === 'paid' || inv.payment_status === 'void') return false;
    if (!inv.payment_due_date) return false;
    return new Date(inv.payment_due_date) < new Date();
  }).length;
  
  const avgAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const stats = [
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Total Amount',
      value: formatCurrency(totalAmount),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-500'
    },
    {
      title: 'Unpaid Amount',
      value: formatCurrency(unpaidAmount),
      icon: AlertTriangle,
      color: 'text-destructive'
    },
    {
      title: 'Average Amount',
      value: formatCurrency(avgAmount),
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  {stat.title === 'Unpaid Amount' && overdueCount > 0 && (
                    <p className="text-xs text-destructive mt-1">
                      {overdueCount} overdue
                    </p>
                  )}
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default InvoiceSummaryStats;
