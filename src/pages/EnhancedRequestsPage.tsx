import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Request } from '@/types/requests';
import SimpleRequestForm from '@/components/requests/SimpleRequestForm';
import RequestDetails from '@/components/requests/RequestDetails';
import { RequestsDashboard } from '@/components/requests/RequestsDashboard';
import SimpleRequestTypeManager from '@/components/organization/requests/SimpleRequestTypeManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import { toast } from '@/components/ui/sonner';
import { Plus, LayoutDashboard, List, Settings } from 'lucide-react';
import { SmartAssignmentService } from '@/services/smartAssignmentService';

export default function EnhancedRequestsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
  const [activeTab, setActiveTab] = useState<'requests' | 'types'>('requests');
  const [requestTypes, setRequestTypes] = useState<any[]>([]);
  const { user } = useAuth();

  const canManageTypes = hasRoleAccess(user?.role, 'manager');

  useEffect(() => {
    fetchRequestTypes();
  }, [user]);

  const fetchRequestTypes = async () => {
    if (!user?.organizationId) return;

    try {
      const { data, error } = await supabase
        .from('request_types')
        .select('*')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true);

      if (error) throw error;
      setRequestTypes(data || []);
    } catch (error) {
      console.error('Error fetching request types:', error);
    }
  };

  const handleRequestSuccess = () => {
    setShowCreateForm(false);
    toast.success("Request created successfully!");
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const handleAssignRequest = async (request: Request) => {
    if (!user?.organizationId) {
      toast.error("Unable to assign request: No organization found");
      return;
    }

    console.log('Starting assignment for request:', request.id, request.request_type);
    
    try {
      // Get the request type object
      const requestType = request.request_type || requestTypes.find(rt => rt.id === request.request_type_id);
      
      if (!requestType) {
        toast.error("Request type not found");
        console.error('Request type not found for:', request.request_type_id);
        return;
      }

      const result = await SmartAssignmentService.assignRequest(
        request.id,
        requestType,
        request.form_data || {},
        user.organizationId
      );

      if (result.assignedUsers && result.assignedUsers.length > 0) {
        const assignedUser = result.assignedUsers[0];
        toast.success(`Request assigned to ${assignedUser.name || assignedUser.email}`);
        console.log('Assignment successful:', result);
        
        // Update the request to show assignment
        await supabase
          .from('requests')
          .update({ 
            assigned_to: assignedUser.id,
            assigned_at: new Date().toISOString()
          })
          .eq('id', request.id);
          
      } else if (result.message) {
        toast.info(result.message);
        console.log('Assignment result:', result.message);
      } else {
        toast.error(result.error || 'No suitable users found for assignment');
        console.error('Assignment failed:', result.error || 'No users found');
      }
    } catch (error) {
      console.error('Error during assignment:', error);
      toast.error('An error occurred while assigning the request');
    }
  };

  const handleStatusChange = async (request: Request, status: string) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', request.id)
        .eq('organization_id', user?.organizationId);

      if (error) throw error;
      toast.success(`Request ${status} successfully!`);
      // Refresh the data - in a real app you'd refetch or update state
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request status');
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Requests</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Track and manage organizational requests with visual indicators and ticket numbers</p>
        </div>
        {activeTab === 'requests' && (
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button
              variant={viewMode === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setViewMode('dashboard')}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <List className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">List View</span>
              <span className="sm:hidden">List</span>
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'requests' | 'types')}>
        <TabsList className={`grid w-full ${canManageTypes ? 'grid-cols-2 max-w-full sm:max-w-[400px]' : 'grid-cols-1 max-w-full sm:max-w-[200px]'}`}>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Requests
          </TabsTrigger>
          {canManageTypes && (
            <TabsTrigger value="types" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Types
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="requests" className="space-y-6 mt-6">
          {viewMode === 'dashboard' ? (
            <RequestsDashboard 
              onViewRequest={handleViewRequest}
              onAssignRequest={handleAssignRequest}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">List view coming soon. Use dashboard view for now.</p>
            </div>
          )}
        </TabsContent>

        {canManageTypes && (
          <TabsContent value="types" className="mt-6">
            <SimpleRequestTypeManager />
          </TabsContent>
        )}
      </Tabs>

      {/* Create Request Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Create New Request
                </DialogTitle>
                <p className="text-muted-foreground">
                  Submit a request to your organization with proper categorization and details.
                </p>
              </div>
            </div>
          </DialogHeader>
          <SimpleRequestForm onSuccess={handleRequestSuccess} onCancel={() => setShowCreateForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <RequestDetails request={selectedRequest} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}