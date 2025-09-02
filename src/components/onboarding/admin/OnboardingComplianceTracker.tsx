import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileCheck,
  User,
  Calendar
} from 'lucide-react';
import { useComplianceTracking } from '@/hooks/onboarding/useOnboardingDocuments';
import { format } from 'date-fns';
import { ComplianceStatus, ComplianceType } from '@/types/onboarding-documents';

export function OnboardingComplianceTracker() {
  const { complianceItems, isLoading, updateCompliance, isUpdating } = useComplianceTracking();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ComplianceType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: 'completed' as ComplianceStatus,
    notes: '',
  });

  const filteredItems = complianceItems.filter(item => {
    const matchesSearch = item.instance?.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.compliance_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.compliance_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getComplianceTypeLabel = (type: ComplianceType) => {
    const labels = {
      i9_verification: 'I-9 Verification',
      tax_forms: 'Tax Forms',
      emergency_contacts: 'Emergency Contacts',
      policy_acknowledgments: 'Policy Acknowledgments',
      background_check: 'Background Check',
      drug_screening: 'Drug Screening',
    };
    return labels[type] || type;
  };

  const getComplianceTypeIcon = (type: ComplianceType) => {
    switch (type) {
      case 'i9_verification':
        return <FileCheck className="w-4 h-4" />;
      case 'tax_forms':
        return <FileCheck className="w-4 h-4" />;
      case 'emergency_contacts':
        return <User className="w-4 h-4" />;
      case 'policy_acknowledgments':
        return <Shield className="w-4 h-4" />;
      case 'background_check':
        return <Shield className="w-4 h-4" />;
      case 'drug_screening':
        return <Shield className="w-4 h-4" />;
      default:
        return <FileCheck className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-600" />;
      case 'not_applicable':
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'not_applicable':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isOverdue = (item: any) => {
    return item.due_date && 
           new Date(item.due_date) < new Date() && 
           !['completed', 'not_applicable'].includes(item.status);
  };

  const calculateOverallProgress = () => {
    if (complianceItems.length === 0) return 0;
    const completedItems = complianceItems.filter(item => 
      item.status === 'completed' || item.status === 'not_applicable'
    ).length;
    return (completedItems / complianceItems.length) * 100;
  };

  const handleUpdateCompliance = async () => {
    if (!selectedItem) return;
    
    try {
      await updateCompliance.mutateAsync({
        compliance_item_id: selectedItem.id,
        ...updateData,
      });
      setUpdateDialogOpen(false);
      setSelectedItem(null);
      setUpdateData({
        status: 'completed',
        notes: '',
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Tracking</h2>
          <p className="text-muted-foreground">
            Monitor and manage onboarding compliance requirements for all employees
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Overall Compliance Progress
          </CardTitle>
          <CardDescription>
            Organization-wide compliance completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Compliance Rate</span>
              <span className="text-2xl font-bold">{Math.round(calculateOverallProgress())}%</span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {complianceItems.filter(item => item.status === 'completed').length}
                </div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {complianceItems.filter(item => item.status === 'in_progress').length}
                </div>
                <div className="text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {complianceItems.filter(item => item.status === 'pending').length}
                </div>
                <div className="text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {complianceItems.filter(item => isOverdue(item)).length}
                </div>
                <div className="text-muted-foreground">Overdue</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search compliance items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select 
          value={statusFilter} 
          onValueChange={(value) => setStatusFilter(value as ComplianceStatus | 'all')}
        >
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="not_applicable">Not Applicable</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={typeFilter} 
          onValueChange={(value) => setTypeFilter(value as ComplianceType | 'all')}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="i9_verification">I-9 Verification</SelectItem>
            <SelectItem value="tax_forms">Tax Forms</SelectItem>
            <SelectItem value="emergency_contacts">Emergency Contacts</SelectItem>
            <SelectItem value="policy_acknowledgments">Policy Acknowledgments</SelectItem>
            <SelectItem value="background_check">Background Check</SelectItem>
            <SelectItem value="drug_screening">Drug Screening</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Compliance Items List */}
      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Compliance Items Found</h3>
              <p className="text-muted-foreground">
                {complianceItems.length === 0 
                  ? "No compliance items have been created yet."
                  : "No items match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className={isOverdue(item) ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getComplianceTypeIcon(item.compliance_type)}
                      {getComplianceTypeLabel(item.compliance_type)}
                      {isOverdue(item) && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {item.instance?.employee?.name} • {item.instance?.employee?.email}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(item.status)} className="flex items-center gap-1">
                      {getStatusIcon(item.status)}
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <div className="font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {item.due_date 
                        ? format(new Date(item.due_date), 'MMM d, yyyy')
                        : 'No due date'
                      }
                    </div>
                  </div>
                  
                  {item.completed_date && (
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <div className="font-medium">
                        {format(new Date(item.completed_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <div className="font-medium">
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">Notes:</div>
                    <div className="text-sm text-muted-foreground">{item.notes}</div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setUpdateData({
                            status: item.status,
                            notes: item.notes || '',
                          });
                        }}
                      >
                        Update Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Compliance Status</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select 
                            value={updateData.status} 
                            onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value as ComplianceStatus }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="not_applicable">Not Applicable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add notes about this compliance item..."
                            value={updateData.notes}
                            onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setUpdateDialogOpen(false);
                              setSelectedItem(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateCompliance}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Updating...' : 'Update Status'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}