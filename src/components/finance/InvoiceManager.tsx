
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InvoiceUpload from './InvoiceUpload';
import InvoiceList from './InvoiceList';

const InvoiceManager: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Invoice</TabsTrigger>
          <TabsTrigger value="manage">Manage Invoices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <InvoiceUpload onUploadSuccess={handleUploadSuccess} />
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-4">
          <InvoiceList refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoiceManager;
