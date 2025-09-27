import React from 'react';
import AdvancedReportsTab from '@/components/finance/tabs/AdvancedReportsTab';
import { FinanceBreadcrumb } from '@/components/finance/navigation/FinanceBreadcrumb';

export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <FinanceBreadcrumb 
        items={[
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Reports', href: '/dashboard/finance/reports' }
        ]} 
      />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
          Comprehensive financial analytics and reporting
        </p>
      </div>

      <AdvancedReportsTab />
    </div>
  );
}