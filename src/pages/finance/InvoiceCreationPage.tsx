import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText } from 'lucide-react';
import { FinanceBreadcrumb } from '@/components/finance/navigation/FinanceBreadcrumb';

export default function InvoiceCreationPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <FinanceBreadcrumb 
        items={[
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Create Invoice', href: '/dashboard/finance/create-invoice' }
        ]} 
      />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">
            Generate professional invoices for your clients
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {!showCreateForm ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateForm(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Standard Invoice
              </CardTitle>
              <CardDescription>
                Create a standard invoice with line items, taxes, and payment terms
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recurring Invoice
              </CardTitle>
              <CardDescription>
                Set up recurring invoices for regular clients (Coming Soon)
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quote/Estimate
              </CardTitle>
              <CardDescription>
                Create quotes and estimates that can be converted to invoices (Coming Soon)
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Builder</CardTitle>
            <CardDescription>
              Invoice creation form will be implemented here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Invoice Builder Coming Soon</h3>
              <p className="text-muted-foreground mb-4">
                The invoice creation form will be implemented in the next phase
              </p>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Back to Templates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}