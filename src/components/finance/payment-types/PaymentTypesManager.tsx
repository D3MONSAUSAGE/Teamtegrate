import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePaymentTypes } from '@/hooks/usePaymentTypes';
import { PaymentTypesList } from './PaymentTypesList';
import { PaymentTypeDialog } from './PaymentTypeDialog';

export const PaymentTypesManager: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const { paymentTypes, isLoading, createPaymentType, updatePaymentType, deletePaymentType } = usePaymentTypes();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Types</CardTitle>
            <CardDescription>
              Manage accepted payment methods for invoices
            </CardDescription>
          </div>
          <Button onClick={() => setShowDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <PaymentTypesList
          paymentTypes={paymentTypes}
          isLoading={isLoading}
          onUpdate={updatePaymentType}
          onDelete={deletePaymentType}
        />
        
        <PaymentTypeDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onSave={createPaymentType}
        />
      </CardContent>
    </Card>
  );
};