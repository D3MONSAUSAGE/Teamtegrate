import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  FileCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  FileText,
  Download,
  Calendar,
  AlertCircle,
  Award
} from 'lucide-react';
import { useCertificateAssignments } from '@/hooks/useCertificateData';
import { format } from 'date-fns';
import CertificatePreviewModal from './CertificatePreviewModal';
import CertificateVerificationDialog from './CertificateVerificationDialog';

interface CertificateAssignment {
  id: string;
  content_title: string;
  assigned_to: string;
  assigned_to_user?: {
    name: string;
    email: string;
  };
  certificate_url?: string;
  certificate_status: string;
  certificate_uploaded_at?: string;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  due_date?: string;
  priority: string;
}

const EmbeddedCertificateReview: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateAssignment | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);

  // Fetch certificate assignments
  const { data: certificateAssignments = [], isLoading } = useCertificateAssignments();

  // Apply filters
  const filteredAssignments = useMemo(() => {
    let filtered = certificateAssignments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.content_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.assigned_to_user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.assigned_to_user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.certificate_status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.priority === priorityFilter);
    }

    return filtered;
  }, [certificateAssignments, searchTerm, statusFilter, priorityFilter]);

  // Group assignments by status
  const pendingCertificates = filteredAssignments.filter(a => a.certificate_status === 'uploaded');
  const verifiedCertificates = filteredAssignments.filter(a => a.certificate_status === 'verified');
  const rejectedCertificates = filteredAssignments.filter(a => a.certificate_status === 'rejected');

  // Statistics
  const stats = {
    total: certificateAssignments.length,
    pending: certificateAssignments.filter(a => a.certificate_status === 'uploaded').length,
    verified: certificateAssignments.filter(a => a.certificate_status === 'verified').length,
    rejected: certificateAssignments.filter(a => a.certificate_status === 'rejected').length
  };

  const handlePreviewCertificate = (assignment: CertificateAssignment) => {
    setSelectedCertificate(assignment);
    setPreviewModalOpen(true);
  };

  const handleVerifyCertificate = (assignment: CertificateAssignment) => {
    setSelectedCertificate(assignment);
    setVerificationDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderCertificateCard = (assignment: CertificateAssignment) => (
    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{assignment.content_title}</h3>
                <p className="text-sm text-muted-foreground">
                  {assignment.assigned_to_user?.name || 'Unknown User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {assignment.assigned_to_user?.email || ''}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={getStatusColor(assignment.certificate_status)}>
                {getStatusIcon(assignment.certificate_status)}
                {assignment.certificate_status}
              </Badge>
              <Badge className={getPriorityColor(assignment.priority)}>
                {assignment.priority} priority
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Uploaded:</span>
              <p className="font-medium">
                {assignment.certificate_uploaded_at 
                  ? format(new Date(assignment.certificate_uploaded_at), 'MMM d, yyyy')
                  : 'Not uploaded'
                }
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date:</span>
              <p className="font-medium">
                {assignment.due_date 
                  ? format(new Date(assignment.due_date), 'MMM d, yyyy')
                  : 'No due date'
                }
              </p>
            </div>
          </div>

          {assignment.verification_notes && (
            <div className="p-2 bg-muted rounded text-sm">
              <p className="font-medium">Verification Notes:</p>
              <p>{assignment.verification_notes}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {assignment.certificate_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreviewCertificate(assignment)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            {assignment.certificate_status === 'uploaded' && (
              <Button
                size="sm"
                onClick={() => handleVerifyCertificate(assignment)}
              >
                <Award className="h-4 w-4 mr-2" />
                Review
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const exportCertificateData = () => {
    const csvData = filteredAssignments.map(assignment => ({
      'Training': assignment.content_title,
      'Employee': assignment.assigned_to_user?.name || 'Unknown',
      'Email': assignment.assigned_to_user?.email || 'Unknown',
      'Status': assignment.certificate_status,
      'Priority': assignment.priority,
      'Uploaded Date': assignment.certificate_uploaded_at 
        ? format(new Date(assignment.certificate_uploaded_at), 'yyyy-MM-dd') 
        : 'Not uploaded',
      'Verified Date': assignment.verified_at 
        ? format(new Date(assignment.verified_at), 'yyyy-MM-dd') 
        : 'Not verified',
      'Due Date': assignment.due_date 
        ? format(new Date(assignment.due_date), 'yyyy-MM-dd') 
        : 'No due date',
      'Verification Notes': assignment.verification_notes || ''
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-review-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <FileCheck className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold">Certificate Review</h2>
        </div>
        <Button onClick={exportCertificateData} size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by training name, employee name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="uploaded">Pending Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending Review
            {pendingCertificates.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {pendingCertificates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verified" className="relative">
            Verified
            {verifiedCertificates.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {verifiedCertificates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="relative">
            Rejected
            {rejectedCertificates.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {rejectedCertificates.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {pendingCertificates.length > 0 ? (
                pendingCertificates.map(renderCertificateCard)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No certificates pending review</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {verifiedCertificates.length > 0 ? (
                verifiedCertificates.map(renderCertificateCard)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No verified certificates</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {rejectedCertificates.length > 0 ? (
                rejectedCertificates.map(renderCertificateCard)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rejected certificates</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CertificatePreviewModal 
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        certificate={selectedCertificate}
      />

      <CertificateVerificationDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        certificate={selectedCertificate}
      />
    </div>
  );
};

export default EmbeddedCertificateReview;