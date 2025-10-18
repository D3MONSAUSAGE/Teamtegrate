import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeRecordUpload from './employee-records/EmployeeRecordUpload';
import EmployeeRecordList from './employee-records/EmployeeRecordList';
import { DocumentTemplatesManager } from './document-templates/DocumentTemplatesManager';
import { ComplianceMatrixView } from './document-templates/ComplianceMatrixView';
import { MyDocumentChecklist } from './employee-records/MyDocumentChecklist';
import { useAuth } from '@/contexts/AuthContext';

const EmployeeRecordsTab: React.FC = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isManager = user?.role && ['manager', 'admin', 'superadmin'].includes(user.role);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={isManager ? "compliance" : "checklist"} className="w-full">
        <TabsList className={`grid w-full max-w-4xl ${isManager ? 'grid-cols-5' : 'grid-cols-2'}`}>
          <TabsTrigger value="checklist">My Documents</TabsTrigger>
          {isManager && (
            <>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="manage">Records</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <MyDocumentChecklist />
        </TabsContent>
        
        {isManager && (
          <>
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
          </>
        )}
      </Tabs>
    </div>
  );
};

export default EmployeeRecordsTab;
