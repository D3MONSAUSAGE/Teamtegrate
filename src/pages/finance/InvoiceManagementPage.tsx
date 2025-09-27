import React from 'react';
import InvoiceManager from '@/components/finance/InvoiceManager';
import { FinanceBreadcrumb } from '@/components/finance/navigation/FinanceBreadcrumb';

export default function InvoiceManagementPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <FinanceBreadcrumb 
        items={[
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Invoice Management', href: '/dashboard/finance/invoices' }
        ]} 
      />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
        <p className="text-muted-foreground">
          Manage uploaded invoices and receipts
        </p>
      </div>

      <InvoiceManager />
    </div>
  );
}