import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  FileCheck,
  AlertCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

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

interface CertificateVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: CertificateAssignment | null;
  onVerificationComplete?: () => void;
}

const CertificateVerificationDialog: React.FC<CertificateVerificationDialogProps> = ({
  open,
  onOpenChange,
  certificate,
  onVerificationComplete
}) => {
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (certificate && open) {
      setVerificationNotes(certificate.verification_notes || '');
    }
  }, [certificate, open]);

  const handleVerification = async (action: 'verify' | 'reject') => {
    if (!certificate || !user) return;

    setIsSubmitting(true);
    
    try {
      const newStatus = action === 'verify' ? 'verified' : 'rejected';
      const currentTime = new Date().toISOString();

      // Update certificate status in database
      const { error: updateError } = await supabase
        .from('training_assignments')
        .update({
          certificate_status: newStatus,
          verified_by: user.id,
          verified_at: currentTime,
          verification_notes: verificationNotes.trim() || null
        })
        .eq('id', certificate.id);

      if (updateError) {
        throw updateError;
      }

      // Send notification to the user about certificate verification
      await supabase.functions.invoke('send-certificate-notification', {
        body: {
          assignmentId: certificate.id,
          userId: certificate.assigned_to,
          action: newStatus,
          verifierName: user.name,
          courseName: certificate.content_title,
          notes: verificationNotes.trim() || null
        }
      });

      // Update completion status if verified
      if (action === 'verify') {
        await supabase
          .from('training_assignments')
          .update({
            status: 'completed',
            completed_at: currentTime,
            completion_score: 100 // External training with verified certificate gets 100%
          })
          .eq('id', certificate.id);
      }

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['training-assignments'] });

      toast.success(
        action === 'verify' 
          ? 'Certificate verified successfully!' 
          : 'Certificate rejected and user notified.'
      );

      onVerificationComplete?.();
      onOpenChange(false);
      setVerificationNotes('');

    } catch (error) {
      console.error('Verification error:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to process certificate verification'
      );
    } finally {
      setIsSubmitting(false);
    }
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

  if (!certificate) return null;

  const canVerify = certificate.certificate_status === 'uploaded';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileCheck className="h-5 w-5 text-blue-600" />
            </div>
            Certificate Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Certificate Information */}
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{certificate.content_title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {certificate.assigned_to_user?.name} ({certificate.assigned_to_user?.email})
                    </p>
                  </div>
                  <Badge className={getStatusColor(certificate.certificate_status)}>
                    {getStatusIcon(certificate.certificate_status)}
                    {certificate.certificate_status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Uploaded:</span>
                    <p className="font-medium">
                      {certificate.certificate_uploaded_at 
                        ? format(new Date(certificate.certificate_uploaded_at), 'PPP')
                        : 'Not uploaded'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <p className="font-medium">
                      {certificate.due_date 
                        ? format(new Date(certificate.due_date), 'PPP')
                        : 'No due date'
                      }
                    </p>
                  </div>
                </div>

                {certificate.certificate_url && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(certificate.certificate_url, '_blank')}
                    >
                      View Certificate
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Verification Notes */}
          {certificate.verification_notes && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Previous Notes:</strong> {certificate.verification_notes}
              </AlertDescription>
            </Alert>
          )}

          {/* Verification Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="verification-notes">
              Verification Notes {canVerify && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="verification-notes"
              placeholder="Add notes about the certificate verification (e.g., quality, completeness, authenticity, etc.)"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
            {canVerify && (
              <p className="text-sm text-muted-foreground">
                Please provide notes explaining your verification decision. This will be shared with the employee.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            {canVerify && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleVerification('reject')}
                  disabled={isSubmitting || !verificationNotes.trim()}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {isSubmitting ? 'Rejecting...' : 'Reject Certificate'}
                </Button>
                
                <Button
                  onClick={() => handleVerification('verify')}
                  disabled={isSubmitting || !verificationNotes.trim()}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isSubmitting ? 'Verifying...' : 'Verify Certificate'}
                </Button>
              </>
            )}
          </div>

          {/* Status Information */}
          {!canVerify && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This certificate has already been {certificate.certificate_status}. 
                {certificate.verified_at && (
                  <span> Verified on {format(new Date(certificate.verified_at), 'PPP')}</span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateVerificationDialog;