import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Request } from '@/types/requests';
import SimpleRequestForm from '@/components/requests/SimpleRequestForm';
import RequestDetails from '@/components/requests/RequestDetails';
import { RequestsDashboard } from '@/components/requests/RequestsDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Plus, LayoutDashboard, List } from 'lucide-react';

export default function EnhancedRequestsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
  const [requestTypes, setRequestTypes] = useState<any[]>([]);
  const { user } = useAuth();

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
    // This would open an assignment dialog or modal
    // For now, just a placeholder
    toast.info("Assignment feature coming soon!");
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">Track and manage organizational requests with visual indicators and ticket numbers</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setViewMode('dashboard')}
            size="sm"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            <List className="mr-2 h-4 w-4" />
            List View
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>
      
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

      {/* Create Request Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Request</DialogTitle>
          </DialogHeader>
          <SimpleRequestForm onSuccess={handleRequestSuccess} />
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