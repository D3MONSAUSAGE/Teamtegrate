
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceUpload from './InvoiceUpload';
import InvoiceList from './InvoiceList';
import { InvoiceBuilder } from './invoices/InvoiceBuilder';
import { WeeklySalesDashboard } from './weekly-sales/WeeklySalesDashboard';
import { PaymentTypesManager } from './payment-types/PaymentTypesManager';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';

const InvoiceManager: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const canManageData = hasRoleAccess(user?.role, 'manager');

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleInvoiceCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className={`grid w-full ${canManageData ? 'grid-cols-4' : 'grid-cols-2'}`}>
          <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
          <TabsTrigger value="manage">Manage Invoices</TabsTrigger>
          {canManageData && (
            <>
              <TabsTrigger value="create">Create Invoice</TabsTrigger>
              <TabsTrigger value="payment-types">Payment Types</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <InvoiceUpload onUploadSuccess={handleUploadSuccess} />
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-4">
          <InvoiceList refreshTrigger={refreshTrigger} />
        </TabsContent>

        {canManageData && (
          <>
            <TabsContent value="create" className="space-y-4">
              <InvoiceBuilder onInvoiceCreated={handleInvoiceCreated} />
            </TabsContent>

            <TabsContent value="payment-types" className="space-y-4">
              <PaymentTypesManager />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default InvoiceManager;
