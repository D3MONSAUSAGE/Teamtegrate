import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeRecordUpload from './employee-records/EmployeeRecordUpload';
import EmployeeRecordList from './employee-records/EmployeeRecordList';

const EmployeeRecordsTab: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">Upload Record</TabsTrigger>
          <TabsTrigger value="manage">Manage Records</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <EmployeeRecordUpload onUploadSuccess={handleUploadSuccess} />
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-4">
          <EmployeeRecordList refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeRecordsTab;
