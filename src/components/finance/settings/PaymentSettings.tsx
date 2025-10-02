import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Building2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PaymentSettings: React.FC = () => {
  const { toast } = useToast();

  const handleSaveStripe = () => {
    toast({
      title: 'Settings Saved',
      description: 'Stripe settings have been updated'
    });
  };

  const handleSaveBank = () => {
    toast({
      title: 'Settings Saved',
      description: 'Bank account settings have been updated'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Settings</h2>
        <p className="text-muted-foreground">Configure payment methods and billing preferences</p>
      </div>

      <Tabs defaultValue="stripe" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Bank Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Configuration</CardTitle>
              <CardDescription>
                Connect your Stripe account to accept online payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe_account_id">Stripe Account ID</Label>
                <Input
                  id="stripe_account_id"
                  placeholder="acct_..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
                <Input
                  id="stripe_publishable_key"
                  placeholder="pk_..."
                />
              </div>
              <Button onClick={handleSaveStripe}>Save Stripe Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Information</CardTitle>
              <CardDescription>
                Bank details that will appear on invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input id="bank_name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Input id="account_name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input id="account_number" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routing_number">Routing Number</Label>
                <Input id="routing_number" />
              </div>
              <Button onClick={handleSaveBank}>Save Bank Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preferences</CardTitle>
              <CardDescription>
                Default settings for new invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default_payment_terms">Default Payment Terms</Label>
                <Input id="default_payment_terms" defaultValue="Net 30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
                <Input id="default_tax_rate" type="number" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_footer">Invoice Footer Text</Label>
                <Input id="invoice_footer" defaultValue="Thank you for your business!" />
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
