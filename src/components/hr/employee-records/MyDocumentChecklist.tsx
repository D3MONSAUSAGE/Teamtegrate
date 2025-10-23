import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Upload, Eye } from 'lucide-react';
import { useMyDocumentChecklist } from '@/hooks/document-templates/useComplianceTracking';
import type { DocumentComplianceTracking } from '@/types/document-templates';
import { EmployeeDocumentUploadDialog } from './EmployeeDocumentUploadDialog';
import { supabase } from '@/integrations/supabase/client';

const statusConfig = {
  compliant: { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', label: 'Compliant' },
  missing: { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Missing' },
  expired: { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Expired' },
  expiring_soon: { icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10', label: 'Expiring Soon' },
  pending_verification: { icon: Clock, color: 'text-info', bgColor: 'bg-info/10', label: 'Pending Verification' },
};

export const MyDocumentChecklist = () => {
  const { data: checklist, isLoading, refetch } = useMyDocumentChecklist();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentComplianceTracking | null>(null);

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

  const requiredDocs = checklist.filter((item) => item.is_required);
  const optionalDocs = checklist.filter((item) => !item.is_required);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Document Checklist</CardTitle>
        <CardDescription>Upload and manage your required documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {requiredDocs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Required Documents</h3>
            {requiredDocs.map((item) => (
              <DocumentItem 
                key={item.requirement_id} 
                item={item}
                onUploadClick={() => {
                  setSelectedDocument(item);
                  setUploadDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {optionalDocs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Optional Documents</h3>
            {optionalDocs.map((item) => (
              <DocumentItem 
                key={item.requirement_id} 
                item={item}
                onUploadClick={() => {
                  setSelectedDocument(item);
                  setUploadDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </CardContent>

      <EmployeeDocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        documentItem={selectedDocument}
        onUploadSuccess={() => {
          refetch();
          setUploadDialogOpen(false);
          setSelectedDocument(null);
        }}
      />
    </Card>
  );
};

const DocumentItem = ({ 
  item, 
  onUploadClick 
}: { 
  item: DocumentComplianceTracking;
  onUploadClick?: () => void;
}) => {
  const status = statusConfig[item.compliance_status];
  const StatusIcon = status.icon;

  const onViewClick = async () => {
    if (!item.file_path) return;
    
    // Get signed URL for viewing
    const { data: { publicUrl } } = await supabase.storage
      .from('employee-records')
      .getPublicUrl(item.file_path);
    
    window.open(publicUrl, '_blank');
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
      <div className={`p-2 rounded-full ${status.bgColor}`}>
        <StatusIcon className={`h-5 w-5 ${status.color}`} />
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold">{item.document_name}</h4>
            <p className="text-sm text-muted-foreground capitalize">
              {item.document_type.replace(/_/g, ' ')}
            </p>
          </div>
          {item.is_required && (
            <Badge variant="outline" className="text-xs">Required</Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={status.bgColor}>
            <StatusIcon className={`h-3 w-3 mr-1 ${status.color}`} />
            {status.label}
          </Badge>

          {item.expiry_date && (
            <span className="text-xs text-muted-foreground">
              {item.compliance_status === 'expired' ? 'Expired' : 'Expires'}: {new Date(item.expiry_date).toLocaleDateString()}
            </span>
          )}

          {item.uploaded_at && (
            <span className="text-xs text-muted-foreground">
              Uploaded: {new Date(item.uploaded_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {item.is_verified && item.verified_at && (
          <div className="flex items-center gap-1 text-xs text-success">
            <CheckCircle className="h-3 w-3" />
            <span>Verified on {new Date(item.verified_at).toLocaleDateString()}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {item.file_path && (
            <Button size="sm" variant="outline" onClick={onViewClick}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
          {(item.compliance_status === 'missing' || item.compliance_status === 'expired' || item.compliance_status === 'expiring_soon') && onUploadClick && (
            <Button size="sm" onClick={onUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
