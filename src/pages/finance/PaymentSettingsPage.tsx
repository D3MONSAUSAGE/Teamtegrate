import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Settings, Shield, DollarSign } from 'lucide-react';
import { FinanceBreadcrumb } from '@/components/finance/navigation/FinanceBreadcrumb';

export default function PaymentSettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <FinanceBreadcrumb 
        items={[
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Payment Settings', href: '/dashboard/finance/settings' }
        ]} 
      />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-muted-foreground">
          Configure payment processing and bank account information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Integration
            </CardTitle>
            <CardDescription>
              Connect your Stripe account to accept online payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status:</span>
              <Badge variant="secondary">Not Connected</Badge>
            </div>
            <Button className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Connect Stripe Account
            </Button>
            <p className="text-xs text-muted-foreground">
              Stripe will be used to process online payments from your invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Bank Account
            </CardTitle>
            <CardDescription>
              Add your bank account for invoice details and wire transfers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Account:</span>
              <Badge variant="secondary">Not Added</Badge>
            </div>
            <Button variant="outline" className="w-full">
              <DollarSign className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
            <p className="text-xs text-muted-foreground">
              Bank details will appear on your invoices for wire transfers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Invoice Settings
            </CardTitle>
            <CardDescription>
              Configure default invoice settings and terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Payment Terms</label>
              <p className="text-sm text-muted-foreground">Net 30 days</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Tax Rate</label>
              <p className="text-sm text-muted-foreground">Not set</p>
            </div>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configure Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Information that appears on your invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <p className="text-sm text-muted-foreground">Your Organization</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <p className="text-sm text-muted-foreground">Not set</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax ID</label>
              <p className="text-sm text-muted-foreground">Not set</p>
            </div>
            <Button variant="outline" className="w-full">
              Edit Organization Details
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}