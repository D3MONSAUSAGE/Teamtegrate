import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyDocumentChecklist } from '@/hooks/document-templates';
import { CheckCircle, XCircle, AlertCircle, Clock, Upload } from 'lucide-react';
import { formatDateInTimezone } from '@/lib/utils/dateFormat';
import type { DocumentComplianceTracking } from '@/types/document-templates';

const statusConfig = {
  compliant: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Compliant' },
  missing: { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Missing' },
  expired: { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Expired' },
  expiring_soon: { icon: AlertCircle, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Expiring Soon' },
  pending_verification: { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Pending Verification' },
};

export const MyDocumentChecklist = () => {
  const { data: checklist, isLoading } = useMyDocumentChecklist();

  if (isLoading) {
    return <div className="text-center py-8">Loading your document checklist...</div>;
  }

  if (!checklist || checklist.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Document Checklist</CardTitle>
          <CardDescription>No document requirements have been assigned to you yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const requiredDocs = checklist.filter((item: DocumentComplianceTracking) => item.is_required);
  const optionalDocs = checklist.filter((item: DocumentComplianceTracking) => !item.is_required);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Document Checklist</h2>
          <p className="text-muted-foreground">
            Upload and manage your required documents
          </p>
        </div>
      </div>

      {requiredDocs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Required Documents</h3>
          {requiredDocs.map((item: DocumentComplianceTracking) => (
            <DocumentItem key={item.requirement_id} item={item} />
          ))}
        </div>
      )}

      {optionalDocs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Optional Documents</h3>
          {optionalDocs.map((item: DocumentComplianceTracking) => (
            <DocumentItem key={item.requirement_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

const DocumentItem = ({ item }: { item: DocumentComplianceTracking }) => {
  const status = statusConfig[item.compliance_status];
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-5 w-5 ${status.color}`} />
              <h4 className="font-semibold">{item.document_name}</h4>
              {item.is_required && (
                <Badge variant="outline" className="text-xs">Required</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="font-medium">Status:</span>
                <Badge variant="secondary" className={status.bgColor}>
                  {status.label}
                </Badge>
              </div>

              {item.expiry_date && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">
                    {item.compliance_status === 'expired' ? 'Expired:' : 'Expires:'}
                  </span>
                  <span>{formatDateInTimezone(item.expiry_date)}</span>
                </div>
              )}

              {item.uploaded_at && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Uploaded:</span>
                  <span>{formatDateInTimezone(item.uploaded_at)}</span>
                </div>
              )}

              {item.is_verified && item.verified_at && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Verified:</span>
                  <span>{formatDateInTimezone(item.verified_at)}</span>
                </div>
              )}
            </div>

            {item.requires_expiry && item.default_validity_days && (
              <p className="text-xs text-muted-foreground">
                This document must be renewed every {item.default_validity_days} days
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {item.file_path && (
              <Button variant="outline" size="sm" asChild>
                <a href={item.file_path} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </Button>
            )}
            {(item.compliance_status === 'missing' || item.compliance_status === 'expired' || item.compliance_status === 'expiring_soon') && (
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
