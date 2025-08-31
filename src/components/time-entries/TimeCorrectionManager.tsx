import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, FileText } from 'lucide-react';
import { ManagerCorrectionRequestsDashboard } from './ManagerCorrectionRequestsDashboard';
import { AdminCorrectionRequestsDashboard } from './AdminCorrectionRequestsDashboard';
import { MyCorrectionRequestsView } from './MyCorrectionRequestsView';
import { useTimeEntryCorrectionRequests } from '@/hooks/useTimeEntryCorrectionRequests';

export const TimeCorrectionManager: React.FC = () => {
  const { currentUser, myRequests, pendingManagerRequests, pendingAdminRequests } = useTimeEntryCorrectionRequests();

  if (!currentUser) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  const isManager = ['manager', 'admin', 'superadmin'].includes(currentUser.role);
  const isAdmin = ['admin', 'superadmin'].includes(currentUser.role);

  // If user is not a manager or admin, just show their own requests
  if (!isManager && !isAdmin) {
    return <MyCorrectionRequestsView />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Time Entry Correction Requests</h2>
      </div>

      <Tabs defaultValue="my-requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            My Requests ({myRequests.length})
          </TabsTrigger>
          
          {isManager && (
            <TabsTrigger value="manager-review" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manager Review ({pendingManagerRequests.length})
            </TabsTrigger>
          )}
          
          {isAdmin && (
            <TabsTrigger value="admin-review" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Review ({pendingAdminRequests.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-requests" className="mt-6">
          <MyCorrectionRequestsView />
        </TabsContent>

        {isManager && (
          <TabsContent value="manager-review" className="mt-6">
            <ManagerCorrectionRequestsDashboard />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="admin-review" className="mt-6">
            <AdminCorrectionRequestsDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};