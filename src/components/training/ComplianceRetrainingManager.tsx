import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  User,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { 
  useComplianceRecords, 
  useForceComplianceRetraining, 
  useReassignCompliance,
  useComplianceTemplates
} from '@/hooks/useComplianceRetraining';
import { format, parseISO } from 'date-fns';
import ReassignTrainingDialog from './ReassignTrainingDialog';

interface ComplianceRetrainingManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ComplianceRetrainingManager: React.FC<ComplianceRetrainingManagerProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    templateId: 'all'
  });
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isRetrainingDialogOpen, setIsRetrainingDialogOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [retrainingReason, setRetrainingReason] = useState('');

  const { data: records = [], isLoading, refetch } = useComplianceRecords(searchTerm, filters);
  const { data: templates = [] } = useComplianceTemplates();
  const forceRetrainingMutation = useForceComplianceRetraining();
  const reassignComplianceMutation = useReassignCompliance();

  const handleForceRetraining = (record: any) => {
    setSelectedRecord(record);
    setIsRetrainingDialogOpen(true);
  };

  const handleReassign = (record: any) => {
    setSelectedRecord(record);
    setIsReassignDialogOpen(true);
  };

  const confirmRetraining = async () => {
    if (!selectedRecord || !retrainingReason.trim()) return;

    try {
      await forceRetrainingMutation.mutateAsync({
        recordId: selectedRecord.id,
        reason: retrainingReason
      });
      setIsRetrainingDialogOpen(false);
      setRetrainingReason('');
      setSelectedRecord(null);
    } catch (error) {
      console.error('Error forcing retraining:', error);
    }
  };

  const getStatusColor = (isCompleted: boolean, completionDate?: string) => {
    if (isCompleted) return 'bg-green-100 text-green-800 border-green-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const renderRecord = (record: any) => {
    const template = templates.find(t => t.id === record.template_id);
    
    return (
      <Card key={record.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {template?.title || 'Compliance Training'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {record.role_classification || 'General Compliance'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getStatusColor(record.is_completed, record.completion_date)}>
                  {record.is_completed ? 'Completed' : 'Pending'}
                </Badge>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="p-1 rounded bg-gray-100">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {record.user?.name || 'Unknown User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {record.user?.email} • {record.user?.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Assigned: {format(parseISO(record.created_at), 'MMM d, yyyy')}
              </div>
              {record.completion_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Completed: {format(parseISO(record.completion_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              {record.is_completed && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleForceRetraining(record)}
                  className="gap-2"
                  disabled={forceRetrainingMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4" />
                  Force Retraining
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleReassign(record)}
                className="gap-2"
                disabled={reassignComplianceMutation.isPending}
              >
                <ArrowRight className="h-4 w-4" />
                Reassign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Compliance Training Manager</h2>
            <p className="text-muted-foreground">
              Manage compliance training assignments and force retraining when needed
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Records
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select 
                  value={filters.templateId} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Records ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading records...</p>
              </div>
            ) : records.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {records.map(renderRecord)}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No compliance records found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Force Retraining Dialog */}
      <Dialog open={isRetrainingDialogOpen} onOpenChange={setIsRetrainingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Compliance Retraining</DialogTitle>
            <DialogDescription>
              This will reset the completion status for {selectedRecord?.user?.name}, requiring them to retake the compliance training.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Retraining</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for requiring retraining..."
                value={retrainingReason}
                onChange={(e) => setRetrainingReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRetrainingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmRetraining}
              disabled={!retrainingReason.trim() || forceRetrainingMutation.isPending}
            >
              Force Retraining
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassignment Dialog */}
      <ReassignTrainingDialog
        open={isReassignDialogOpen}
        onOpenChange={setIsReassignDialogOpen}
        assignment={selectedRecord}
        isComplianceMode={true}
      />
    </>
  );
};

export default ComplianceRetrainingManager;