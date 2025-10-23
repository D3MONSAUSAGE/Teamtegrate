import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, Clock, FileUp, FileText, Download } from 'lucide-react';
import type { DocumentComplianceTracking } from '@/types/document-templates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusConfig = {
  compliant: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Compliant' },
  missing: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Missing' },
  expired: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Expired' },
  expiring_soon: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Expiring Soon' },
  pending_verification: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Pending Verification' },
};

interface DocumentComplianceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compliance: DocumentComplianceTracking | null;
  employeeName: string;
  onUploadClick?: (compliance: DocumentComplianceTracking, employeeName: string) => void;
  onReplaceClick?: (compliance: DocumentComplianceTracking, employeeName: string) => void;
}

export const DocumentComplianceDialog = ({ 
  open, 
  onOpenChange, 
  compliance,
  employeeName,
  onUploadClick,
  onReplaceClick
}: DocumentComplianceDialogProps) => {
  if (!compliance) return null;

  const config = statusConfig[compliance.compliance_status];
  const StatusIcon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            {compliance.document_name} - {employeeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${config.bg}`}>
              <StatusIcon className={`w-5 h-5 ${config.color}`} />
              <span className={`font-medium ${config.color}`}>{config.label}</span>
            </div>
          </div>

          {/* Document Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Document Type</p>
                <p className="font-medium capitalize">{compliance.document_type?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Required</p>
                <Badge variant={compliance.is_required ? "default" : "secondary"}>
                  {compliance.is_required ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            {compliance.expiry_date && (
              <div>
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <p className="font-medium">
                  {new Date(compliance.expiry_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {compliance.uploaded_at && (
              <div>
                <p className="text-sm text-muted-foreground">Uploaded At</p>
                <p className="font-medium">
                  {new Date(compliance.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {compliance.compliance_status === 'missing' ? (
              <Button 
                className="flex-1"
                onClick={() => {
                  onUploadClick?.(compliance, employeeName);
                  onOpenChange(false);
                }}
              >
                <FileUp className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            ) : (
              <>
                {compliance.file_path && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={async () => {
                      try {
                        const { data } = await supabase.storage
                          .from('employee-records')
                          .createSignedUrl(compliance.file_path!, 3600);
                        if (data?.signedUrl) {
                          window.open(data.signedUrl, '_blank');
                        } else {
                          toast.error('Failed to load document');
                        }
                      } catch (error) {
                        toast.error('Failed to load document');
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    View Document
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    onReplaceClick?.(compliance, employeeName);
                    onOpenChange(false);
                  }}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Replace Document
                </Button>
              </>
            )}
          </div>

          {/* Verification Status */}
          {compliance.is_verified !== null && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Verification Status</p>
              <div className="flex items-center gap-2">
                {compliance.is_verified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Verified</span>
                    {compliance.verified_at && (
                      <span className="text-xs text-muted-foreground ml-2">
                        on {new Date(compliance.verified_at).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Pending Verification</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
