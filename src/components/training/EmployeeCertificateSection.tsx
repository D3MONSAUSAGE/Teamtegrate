import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileCheck, 
  Eye, 
  Download, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import CertificatePreviewModal from './CertificatePreviewModal';

interface CertificateAssignment {
  id: string;
  content_title: string;
  assigned_to: string;
  certificate_url?: string;
  certificate_status: string;
  certificate_uploaded_at?: string;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  due_date?: string;
  priority: string;
  assignment_type: string;
  status: string;
  assigned_at: string;
}

interface EmployeeCertificateSectionProps {
  employeeName: string;
  employeeEmail: string;
  assignments: CertificateAssignment[];
}

const EmployeeCertificateSection: React.FC<EmployeeCertificateSectionProps> = ({
  employeeName,
  employeeEmail,
  assignments
}) => {
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Filter assignments that have certificates or require certificates
  const certificateAssignments = assignments.filter(assignment => 
    assignment.certificate_url || 
    assignment.certificate_status !== 'not_required'
  );

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

  const handleViewCertificate = (assignment: CertificateAssignment) => {
    const certificateData = {
      ...assignment,
      assigned_to_user: {
        name: employeeName,
        email: employeeEmail
      }
    };
    setSelectedCertificate(certificateData);
    setPreviewModalOpen(true);
  };

  const handleDownloadCertificate = (assignment: CertificateAssignment) => {
    if (assignment.certificate_url) {
      const link = document.createElement('a');
      link.href = assignment.certificate_url;
      link.download = `certificate_${assignment.content_title}_${employeeName}`.replace(/\s+/g, '_');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const uploadedCount = certificateAssignments.filter(a => a.certificate_status === 'uploaded' || a.certificate_status === 'verified').length;
  const verifiedCount = certificateAssignments.filter(a => a.certificate_status === 'verified').length;
  const pendingCount = certificateAssignments.filter(a => a.certificate_status === 'uploaded').length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            Certificates ({certificateAssignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Certificate Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg border bg-muted/20">
              <p className="text-2xl font-bold text-blue-600">{uploadedCount}</p>
              <p className="text-sm text-muted-foreground">Uploaded</p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-muted/20">
              <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
              <p className="text-sm text-muted-foreground">Verified</p>
            </div>
            <div className="text-center p-3 rounded-lg border bg-muted/20">
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </div>

          <Separator />

          {/* Certificate List */}
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {certificateAssignments.length > 0 ? (
                certificateAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{assignment.content_title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-xs ${getStatusColor(assignment.certificate_status)}`}>
                            {getStatusIcon(assignment.certificate_status)}
                            <span className="ml-1">{assignment.certificate_status}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {assignment.assignment_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {assignment.certificate_url && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewCertificate(assignment)}
                              className="h-8 px-2"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCertificate(assignment)}
                              className="h-8 px-2"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Assigned: {format(new Date(assignment.assigned_at), 'MMM d, yyyy')}</span>
                      </div>
                      {assignment.certificate_uploaded_at && (
                        <div className="flex items-center gap-1">
                          <FileCheck className="h-3 w-3" />
                          <span>Uploaded: {format(new Date(assignment.certificate_uploaded_at), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {assignment.due_date && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {assignment.verified_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Verified: {format(new Date(assignment.verified_at), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    {assignment.verification_notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-xs">
                        <p className="font-medium mb-1">Verification Notes:</p>
                        <p>{assignment.verification_notes}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No certificates found</p>
                  <p className="text-sm">This employee has no training assignments that require certificates.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Certificate Preview Modal */}
      <CertificatePreviewModal 
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        certificate={selectedCertificate}
      />
    </>
  );
};

export default EmployeeCertificateSection;