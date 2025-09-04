import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ExternalLink, 
  Download,
  FileText,
  Image as ImageIcon,
  FileCheck,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

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

interface CertificatePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: CertificateAssignment | null;
}

const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  open,
  onOpenChange,
  certificate
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!certificate) return null;

  const getFileExtension = (url: string) => {
    const parts = url.split('.');
    return parts[parts.length - 1].toLowerCase();
  };

  const isImageFile = (url: string) => {
    const extension = getFileExtension(url);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
  };

  const isPdfFile = (url: string) => {
    const extension = getFileExtension(url);
    return extension === 'pdf';
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

  const handleDownload = () => {
    if (certificate.certificate_url) {
      const link = document.createElement('a');
      link.href = certificate.certificate_url;
      link.download = `certificate_${certificate.content_title}_${certificate.assigned_to_user?.name || 'unknown'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (certificate.certificate_url) {
      window.open(certificate.certificate_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileCheck className="h-5 w-5 text-blue-600" />
              </div>
              Certificate Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!certificate.certificate_url}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewTab}
                disabled={!certificate.certificate_url}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Certificate Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Training Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Training Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Course:</span>
                    <p className="font-medium">{certificate.content_title}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Employee:</span>
                    <p className="font-medium">{certificate.assigned_to_user?.name || 'Unknown User'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <p className="font-medium">{certificate.assigned_to_user?.email || 'Unknown Email'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={`ml-2 ${getStatusColor(certificate.certificate_status)}`}>
                      {getStatusIcon(certificate.certificate_status)}
                      {certificate.certificate_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Upload Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Uploaded:</span>
                    <p className="font-medium">
                      {certificate.certificate_uploaded_at 
                        ? format(new Date(certificate.certificate_uploaded_at), 'PPP pp')
                        : 'Not uploaded'
                      }
                    </p>
                  </div>
                  {certificate.verified_at && (
                    <div>
                      <span className="text-sm text-muted-foreground">Verified:</span>
                      <p className="font-medium">
                        {format(new Date(certificate.verified_at), 'PPP pp')}
                      </p>
                    </div>
                  )}
                  {certificate.due_date && (
                    <div>
                      <span className="text-sm text-muted-foreground">Due Date:</span>
                      <p className="font-medium">
                        {format(new Date(certificate.due_date), 'PPP')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Notes */}
          {certificate.verification_notes && (
            <div className="space-y-2">
              <h3 className="font-semibold">Verification Notes</h3>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{certificate.verification_notes}</p>
              </div>
            </div>
          )}

          {/* Certificate Preview */}
          {certificate.certificate_url && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Certificate Preview</h3>
              <div className="border rounded-lg p-4 bg-muted/20">
                {isImageFile(certificate.certificate_url) ? (
                  <div className="space-y-4">
                    {!imageError ? (
                      <div className="flex justify-center">
                        <img
                          src={certificate.certificate_url}
                          alt="Certificate"
                          className="max-w-full max-h-[500px] rounded border shadow-sm"
                          onLoad={() => setIsLoading(false)}
                          onError={() => {
                            setImageError(true);
                            setIsLoading(false);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                        <p>Unable to preview image</p>
                        <p className="text-sm">Click "Open in New Tab" to view the certificate</p>
                      </div>
                    )}
                  </div>
                ) : isPdfFile(certificate.certificate_url) ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>PDF Certificate</p>
                      <p className="text-sm">Click "Open in New Tab" to view the PDF</p>
                    </div>
                    {/* PDF Embed for modern browsers */}
                    <div className="w-full h-96 border rounded">
                      <iframe
                        src={`${certificate.certificate_url}#toolbar=0`}
                        className="w-full h-full rounded"
                        title="Certificate PDF"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p>File Preview Not Available</p>
                    <p className="text-sm">File type: {getFileExtension(certificate.certificate_url).toUpperCase()}</p>
                    <p className="text-sm">Click "Download" or "Open in New Tab" to view the certificate</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!certificate.certificate_url && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
              <p>No certificate uploaded</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificatePreviewModal;