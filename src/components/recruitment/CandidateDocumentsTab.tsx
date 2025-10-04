import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Upload, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useRecruitmentDocuments } from '@/hooks/recruitment/useRecruitmentDocuments';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import type { CandidateWithDetails } from '@/types/recruitment';

interface CandidateDocumentsTabProps {
  candidate: CandidateWithDetails;
}

export function CandidateDocumentsTab({ candidate }: CandidateDocumentsTabProps) {
  const { documents, isLoading } = useRecruitmentDocuments(candidate.id);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  if (isLoading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documents</h3>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <CardTitle className="text-base">{doc.file_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {doc.document_type} • Uploaded {format(new Date(doc.uploaded_at), 'PPP')}
                      </p>
                      {doc.file_size_bytes && (
                        <p className="text-sm text-muted-foreground">
                          {(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        candidateId={candidate.id}
      />
    </div>
  );
}
