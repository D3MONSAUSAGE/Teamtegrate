import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { supportsBlobUrls, supportsInlinePDFs, getFileTypeCategory } from '@/lib/browser';

interface DocumentViewerProps {
  documentPath: string;
  documentName: string;
  children?: React.ReactNode;
}

export const DocumentViewer = ({ documentPath, documentName, children }: DocumentViewerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewingStrategy, setViewingStrategy] = useState<'blob' | 'signed' | 'google' | 'download'>('blob');

  const fileType = getFileTypeCategory(documentName);

  useEffect(() => {
    if (isOpen && !fileUrl && !fileContent) {
      loadDocument();
    }
  }, [isOpen]);

  const loadDocument = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (fileType === 'text') {
        await loadTextContent();
      } else {
        await loadFileWithStrategies();
      }
    } catch (error) {
      console.error('Error loading document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load document';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTextContent = async () => {
    // Handle both storage_id and file_path formats
    const path = documentPath.startsWith('/') ? documentPath.slice(1) : documentPath;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .download(path);

    if (error) throw new Error(`Failed to download text file: ${error.message}`);

    const text = await data.text();
    setFileContent(text);
  };

  const loadFileWithStrategies = async () => {
    // Handle both storage_id and file_path formats - normalize path
    const path = documentPath.startsWith('/') ? documentPath.slice(1) : documentPath;
    
    // Strategy 1: Try blob URL (works in most browsers)
    if (supportsBlobUrls()) {
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .download(path);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        setFileUrl(url);
        setViewingStrategy('blob');
        return;
      } catch (error) {
        console.warn('Blob URL strategy failed:', error);
      }
    }

    // Strategy 2: Try signed URL
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path, 3600);

      if (error) throw error;

      setFileUrl(data.signedUrl);
      setViewingStrategy('signed');
      return;
    } catch (error) {
      console.warn('Signed URL strategy failed:', error);
    }

    // Strategy 3: For Google Docs viewer, we need a publicly accessible URL
    if (fileType === 'pdf' || fileType === 'document') {
      try {
        // Try to get a signed URL for Google Docs viewer
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(path, 3600);

        if (!error && data.signedUrl) {
          setFileUrl(data.signedUrl);
          setViewingStrategy('google');
          return;
        }
      } catch (error) {
        console.warn('Google Docs strategy failed:', error);
      }
    }

    // Strategy 4: Download only
    setViewingStrategy('download');
    throw new Error('Cannot preview this file type. Download is available.');
  };

  const handleDownload = async () => {
    try {
      // Handle both storage_id and file_path formats
      const path = documentPath.startsWith('/') ? documentPath.slice(1) : documentPath;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleOpenInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const getGoogleDocsUrl = () => {
    if (viewingStrategy === 'google') {
      // Use signed URL for Google Docs viewer
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl || '')}&embedded=true`;
    }
    if (!fileUrl) return null;
    if (fileType === 'pdf' || fileType === 'document') {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
    return null;
  };

  const renderViewer = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading document...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[600px] text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <div className="text-lg font-medium mb-2">Cannot preview document</div>
            <div className="text-muted-foreground text-sm mb-4">{error}</div>
          </div>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download File Instead
          </Button>
        </div>
      );
    }

    if (fileType === 'text' && fileContent) {
      return (
        <div className="h-[600px] overflow-auto">
          <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-muted rounded">
            {fileContent}
          </pre>
        </div>
      );
    }

    if (fileType === 'image' && fileUrl) {
      return (
        <div className="h-[600px] overflow-auto flex items-center justify-center bg-muted/20">
          <img
            src={fileUrl}
            alt={documentName}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      );
    }

    if (fileType === 'pdf' && (fileUrl || viewingStrategy === 'google')) {
      const googleDocsUrl = getGoogleDocsUrl();
      
      // Use Google Docs viewer if strategy is 'google' or if inline PDFs aren't supported
      if (viewingStrategy === 'google' || (googleDocsUrl && !supportsInlinePDFs())) {
        return (
          <iframe
            src={googleDocsUrl}
            className="w-full h-[600px] border-0"
            title={documentName}
            onError={() => setError('Failed to load PDF preview')}
          />
        );
      }

      // Try direct PDF viewing
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[600px] border-0"
          title={documentName}
          onError={() => setError('Failed to load PDF. Try downloading instead.')}
        />
      );
    }

    if (fileType === 'document' && (fileUrl || viewingStrategy === 'google')) {
      const googleDocsUrl = getGoogleDocsUrl();
      
      if (googleDocsUrl) {
        return (
          <iframe
            src={googleDocsUrl}
            className="w-full h-[600px] border-0"
            title={documentName}
            onError={() => setError('Failed to load document preview')}
          />
        );
      }
    }

    // Fallback for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center">
        <div className="text-muted-foreground mb-4">
          Cannot preview this file type in browser
        </div>
        <div className="space-x-2">
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
          {fileUrl && (
            <Button onClick={handleOpenInNewTab} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderControls = () => {
    if (fileType === 'image' && fileUrl) {
      return (
        <div className="flex items-center gap-2 p-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.max(25, zoom - 25))}
            disabled={zoom <= 25}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{zoom}%</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.min(200, zoom + 25))}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          {fileUrl && (
            <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
              <ExternalLink className="h-4 w-4 mr-1" />
              New Tab
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 p-2 border-t">
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        {fileUrl && (
          <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
            <ExternalLink className="h-4 w-4 mr-1" />
            New Tab
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-left">{documentName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {renderViewer()}
        </div>
        {renderControls()}
      </DialogContent>
    </Dialog>
  );
};