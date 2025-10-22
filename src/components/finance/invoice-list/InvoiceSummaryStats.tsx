import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, FileText, AlertTriangle, TrendingUp, Upload, FileCheck, Warehouse, Edit } from 'lucide-react';
import type { UnifiedInvoice } from '@/types/unifiedInvoice';

interface InvoiceSummaryStatsProps {
  invoices: UnifiedInvoice[];
}

const InvoiceSummaryStats: React.FC<InvoiceSummaryStatsProps> = ({ invoices }) => {
  const totalInvoices = invoices.length;
  const uploadedCount = invoices.filter(inv => inv.source === 'uploaded').length;
  const createdCount = invoices.filter(inv => inv.source === 'created').length;
  const manualCount = invoices.filter(inv => 
    inv.source === 'created' && inv.created_data?.creation_method === 'manual'
  ).length;
  const warehouseCount = invoices.filter(inv => 
    inv.source === 'created' && inv.created_data?.creation_method === 'warehouse_checkout'
  ).length;
  
  const totalRevenue = invoices
    .filter(inv => inv.source === 'created')
    .reduce((sum, inv) => sum + inv.total_amount, 0);
  
  const totalExpenses = invoices
    .filter(inv => inv.source === 'uploaded')
    .reduce((sum, inv) => sum + inv.total_amount, 0);
  
  const totalAmount = totalRevenue + totalExpenses;
  
  const unpaidAmount = invoices
    .filter(inv => inv.payment_status === 'unpaid' || inv.payment_status === 'partial' || inv.payment_status === 'pending' || inv.payment_status === 'overdue')
    .reduce((sum, inv) => sum + inv.balance_due, 0);
  
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  
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
      subtitle: `${uploadedCount} uploaded, ${createdCount} created`,
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Total Outstanding',
      value: formatCurrency(unpaidAmount),
      subtitle: overdueCount > 0 ? `${overdueCount} overdue` : undefined,
      icon: AlertTriangle,
      color: 'text-destructive'
    },
    {
      title: 'Total Collected',
      value: formatCurrency(totalCollected),
      subtitle: `${Math.round((totalCollected / (totalAmount || 1)) * 100)}% collection rate`,
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-500'
    },
    {
      title: 'Sales Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: `${manualCount} manual, ${warehouseCount} warehouse`,
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
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtitle}
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
