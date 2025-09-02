import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Download,
  Info,
  Calendar
} from 'lucide-react';
import { useMyOnboarding } from '@/hooks/onboarding/useOnboardingInstances';
import { useDocumentRequirements, useDocumentSubmissions } from '@/hooks/onboarding/useOnboardingDocuments';
import { format } from 'date-fns';

export function EmployeeDocumentPortal() {
  const { user } = useAuth();
  const { data: onboardingInstance } = useMyOnboarding();
  const { requirements } = useDocumentRequirements();
  const { submissions, submitDocument, isSubmitting } = useDocumentSubmissions(onboardingInstance?.id);
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: selectedRequirement ? {
      ...Object.fromEntries(
        selectedRequirement.allowed_file_types.map((type: string) => [
          `application/${type}`,
          type === 'pdf' ? ['.pdf'] : 
          type === 'doc' ? ['.doc'] : 
          type === 'docx' ? ['.docx'] : 
          type === 'jpg' ? ['.jpg', '.jpeg'] : 
          type === 'png' ? ['.png'] : 
          [`.${type}`]
        ])
      )
    } : undefined,
    maxSize: selectedRequirement ? selectedRequirement.max_file_size_mb * 1024 * 1024 : undefined,
  });

  const getSubmissionForRequirement = (requirementId: string) => {
    return submissions.find(sub => sub.requirement_id === requirementId);
  };

  const calculateProgress = () => {
    if (requirements.length === 0) return 0;
    const completedCount = requirements.filter(req => {
      const submission = getSubmissionForRequirement(req.id);
      return submission && submission.submission_status === 'approved';
    }).length;
    return (completedCount / requirements.length) * 100;
  };

  const getRequirementStatus = (requirement: any) => {
    const submission = getSubmissionForRequirement(requirement.id);
    if (!submission) return 'not_submitted';
    return submission.submission_status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
      case 'needs_revision':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'pending':
      case 'under_review':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
      case 'needs_revision':
        return 'destructive';
      case 'pending':
      case 'under_review':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'needs_revision':
        return 'Needs Revision';
      case 'pending':
        return 'Pending Review';
      case 'under_review':
        return 'Under Review';
      default:
        return 'Not Submitted';
    }
  };

  const isOverdue = (requirement: any) => {
    if (!onboardingInstance || !requirement.due_days_after_start) return false;
    
    const dueDate = new Date(onboardingInstance.start_date);
    dueDate.setDate(dueDate.getDate() + requirement.due_days_after_start);
    
    const submission = getSubmissionForRequirement(requirement.id);
    return new Date() > dueDate && (!submission || submission.submission_status !== 'approved');
  };

  const handleSubmitDocument = async () => {
    if (!uploadFile || !selectedRequirement || !onboardingInstance) return;

    try {
      await submitDocument.mutateAsync({
        requirement_id: selectedRequirement.id,
        instance_id: onboardingInstance.id,
        file: uploadFile,
      });
      
      setUploadDialogOpen(false);
      setSelectedRequirement(null);
      setUploadFile(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (!onboardingInstance) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Onboarding</h3>
          <p className="text-muted-foreground">
            You don't have an active onboarding process. Contact your manager if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Submission Portal</h1>
          <p className="text-muted-foreground">
            Submit your required onboarding documents and track their approval status
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Submission Progress
          </CardTitle>
          <CardDescription>
            Track your completion of required onboarding documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-2xl font-bold">{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {requirements.filter(req => getRequirementStatus(req) === 'approved').length}
                </div>
                <div className="text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {requirements.filter(req => ['pending', 'under_review'].includes(getRequirementStatus(req))).length}
                </div>
                <div className="text-muted-foreground">Under Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {requirements.filter(req => ['rejected', 'needs_revision'].includes(getRequirementStatus(req))).length}
                </div>
                <div className="text-muted-foreground">Need Action</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {requirements.filter(req => getRequirementStatus(req) === 'not_submitted').length}
                </div>
                <div className="text-muted-foreground">Not Submitted</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Requirements */}
      <div className="grid gap-4">
        {requirements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Document Requirements</h3>
              <p className="text-muted-foreground">
                There are no document requirements for your onboarding process at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          requirements.map((requirement) => {
            const status = getRequirementStatus(requirement);
            const submission = getSubmissionForRequirement(requirement.id);
            const overdue = isOverdue(requirement);

            return (
              <Card key={requirement.id} className={overdue ? 'border-red-200 bg-red-50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {requirement.name}
                        {requirement.is_required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {overdue && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {requirement.description}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(status)} className="flex items-center gap-1">
                        {getStatusIcon(status)}
                        {getStatusLabel(status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Due Date Info */}
                    {requirement.due_days_after_start && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Due: {format(
                          new Date(new Date(onboardingInstance.start_date).getTime() + 
                          requirement.due_days_after_start * 24 * 60 * 60 * 1000), 
                          'MMM d, yyyy'
                        )}
                      </div>
                    )}

                    {/* Instructions */}
                    {requirement.instructions && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          {requirement.instructions}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* File Requirements */}
                    <div className="text-sm text-muted-foreground">
                      <strong>File Requirements:</strong> {requirement.allowed_file_types.join(', ').toUpperCase()} files, 
                      max {requirement.max_file_size_mb}MB
                    </div>

                    {/* Submission Details */}
                    {submission && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Submitted File:</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <div className="text-sm">{submission.file_name}</div>
                        
                        {submission.reviewer_notes && (
                          <div className="mt-2 p-2 bg-blue-100 rounded text-sm">
                            <strong>Reviewer Notes:</strong> {submission.reviewer_notes}
                          </div>
                        )}
                        
                        {submission.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                            <strong>Rejection Reason:</strong> {submission.rejection_reason}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      {submission && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                      
                      {(!submission || ['rejected', 'needs_revision'].includes(status)) && (
                        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              onClick={() => setSelectedRequirement(requirement)}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {submission ? 'Resubmit' : 'Submit'} Document
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Submit Document</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label>Document: {selectedRequirement?.name}</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Allowed types: {selectedRequirement?.allowed_file_types.join(', ').toUpperCase()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Max size: {selectedRequirement?.max_file_size_mb}MB
                                </p>
                              </div>

                              <div 
                                {...getRootProps()} 
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                                  ${uploadFile ? 'border-green-500 bg-green-50' : ''}
                                `}
                              >
                                <input {...getInputProps()} />
                                {uploadFile ? (
                                  <div>
                                    <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                                    <p className="font-medium">{uploadFile.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {Math.round(uploadFile.size / 1024)} KB
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                    <p>
                                      {isDragActive
                                        ? "Drop the file here..."
                                        : "Drag 'n' drop a file here, or click to select"
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setUploadDialogOpen(false);
                                    setSelectedRequirement(null);
                                    setUploadFile(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleSubmitDocument}
                                  disabled={!uploadFile || isSubmitting}
                                >
                                  {isSubmitting ? 'Submitting...' : 'Submit Document'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default EmployeeDocumentPortal;