import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeRecordUpload from './employee-records/EmployeeRecordUpload';
import EmployeeRecordList from './employee-records/EmployeeRecordList';
import { DocumentTemplatesManager } from './document-templates/DocumentTemplatesManager';
import { ComplianceMatrixView } from './document-templates/ComplianceMatrixView';

const EmployeeRecordsTab: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="manage">Records</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <EmployeeRecordUpload onUploadSuccess={handleUploadSuccess} />
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-4">
          <EmployeeRecordList refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <DocumentTemplatesManager />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceMatrixView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeRecordsTab;
