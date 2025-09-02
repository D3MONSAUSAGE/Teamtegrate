import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useDocumentSubmissions } from '@/hooks/onboarding/useOnboardingDocuments';
import { format } from 'date-fns';
import { SubmissionStatus } from '@/types/onboarding-documents';

export function OnboardingSubmissionsList() {
  const { submissions, isLoading, reviewSubmission, isReviewing } = useDocumentSubmissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved' as SubmissionStatus,
    reviewer_notes: '',
    rejection_reason: '',
  });

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.requirement?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.submission_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'under_review':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'needs_revision':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'under_review':
        return 'secondary';
      case 'needs_revision':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const isOverdue = (submission: any) => {
    return submission.due_date && 
           new Date(submission.due_date) < new Date() && 
           submission.submission_status !== 'approved';
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;
    
    try {
      await reviewSubmission.mutateAsync({
        submission_id: selectedSubmission.id,
        ...reviewData,
      });
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
      setReviewData({
        status: 'approved',
        reviewer_notes: '',
        rejection_reason: '',
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
          <h2 className="text-2xl font-bold">Document Submissions</h2>
          <p className="text-muted-foreground">
            Review and manage all onboarding document submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select 
          value={statusFilter} 
          onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'all')}
        >
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="needs_revision">Needs Revision</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List */}
      <div className="grid gap-4">
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Submissions Found</h3>
              <p className="text-muted-foreground">
                {submissions.length === 0 
                  ? "No document submissions have been made yet."
                  : "No submissions match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className={isOverdue(submission) ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {submission.requirement?.name || 'Unknown Document'}
                      {isOverdue(submission) && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {submission.employee?.name} • {submission.employee?.email}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(submission.submission_status)} className="flex items-center gap-1">
                      {getStatusIcon(submission.submission_status)}
                      {submission.submission_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">File:</span>
                    <div className="font-medium">{submission.file_name}</div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <div className="font-medium">
                      {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <div className="font-medium">
                      {submission.due_date 
                        ? format(new Date(submission.due_date), 'MMM d, yyyy')
                        : 'No due date'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">File Size:</span>
                    <div className="font-medium">
                      {Math.round(submission.file_size / 1024)} KB
                    </div>
                  </div>
                </div>

                {submission.reviewer_notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">Reviewer Notes:</div>
                    <div className="text-sm text-muted-foreground">{submission.reviewer_notes}</div>
                  </div>
                )}

                {submission.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <div className="text-sm font-medium mb-1 text-red-800">Rejection Reason:</div>
                    <div className="text-sm text-red-700">{submission.rejection_reason}</div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  
                  {submission.submission_status === 'pending' && (
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Document Submission</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="status">Review Decision</Label>
                            <Select 
                              value={reviewData.status} 
                              onValueChange={(value) => setReviewData(prev => ({ ...prev, status: value as SubmissionStatus }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="approved">Approve</SelectItem>
                                <SelectItem value="rejected">Reject</SelectItem>
                                <SelectItem value="needs_revision">Needs Revision</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="notes">Reviewer Notes</Label>
                            <Textarea
                              id="notes"
                              placeholder="Add notes about your review decision..."
                              value={reviewData.reviewer_notes}
                              onChange={(e) => setReviewData(prev => ({ ...prev, reviewer_notes: e.target.value }))}
                            />
                          </div>

                          {reviewData.status === 'rejected' && (
                            <div>
                              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                              <Textarea
                                id="rejection-reason"
                                placeholder="Please explain why this document is being rejected..."
                                value={reviewData.rejection_reason}
                                onChange={(e) => setReviewData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                                required
                              />
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setReviewDialogOpen(false);
                                setSelectedSubmission(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleReviewSubmission}
                              disabled={isReviewing || (reviewData.status === 'rejected' && !reviewData.rejection_reason)}
                            >
                              {isReviewing ? 'Submitting...' : 'Submit Review'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}