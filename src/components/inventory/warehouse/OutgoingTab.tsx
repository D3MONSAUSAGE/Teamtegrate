import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TruckIcon, ShoppingCart } from 'lucide-react';

export const OutgoingTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Outgoing & Sales
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Inventory Withdrawals & Sales</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Manage inventory withdrawals, set sale prices, and process sales transactions.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};