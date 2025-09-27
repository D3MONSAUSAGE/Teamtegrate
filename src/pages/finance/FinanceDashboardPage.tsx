import React from 'react';
import FinanceDashboardTab from '@/components/finance/tabs/FinanceDashboardTab';
import { FinanceBreadcrumb } from '@/components/finance/navigation/FinanceBreadcrumb';

export default function FinanceDashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <FinanceBreadcrumb 
        items={[
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Dashboard', href: '/dashboard/finance/dashboard' }
        ]} 
      />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of financial performance and key metrics
        </p>
      </div>

      <FinanceDashboardTab />
    </div>
  );
}