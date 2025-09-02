import React from 'react';
import { FileText, Download, Trash2, Eye, Pin, PinOff, Image, File, FileSpreadsheet, Calendar, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DocumentViewer } from './DocumentViewer';
import { getFileTypeCategory } from '@/lib/browser';
import { format } from 'date-fns';

interface DocumentItem {
  id: string;
  title: string;
  file_path: string;
  storage_id?: string;
  file_type: string;
  created_at: string;
  size_bytes: number;
  folder?: string | null;
  is_pinned?: boolean;
}

interface DocumentCardProps {
  document: DocumentItem;
  onDocumentDeleted: () => void;
  onDocumentUpdated?: () => void;
  canPin?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDocumentDeleted,
  onDocumentUpdated,
  canPin = false,
}) => {
  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    const category = getFileTypeCategory(fileName);
    const iconClass = "h-6 w-6";
    
    switch (category) {
      case 'image':
        return <Image className={`${iconClass} text-green-500`} />;
      case 'pdf':
        return <FileText className={`${iconClass} text-red-500`} />;
      case 'document':
        return <FileSpreadsheet className={`${iconClass} text-blue-500`} />;
      case 'text':
        return <FileText className={`${iconClass} text-gray-500`} />;
      default:
        return <File className={`${iconClass} text-gray-400`} />;
    }
  };

  const getFileTypeLabel = (fileType: string) => {
    // Handle common file types with user-friendly labels
    const mimeType = fileType.toLowerCase();
    
    // Common document types
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'Word';
    if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) return 'Excel';
    if (mimeType.includes('presentationml') || mimeType.includes('powerpoint')) return 'PowerPoint';
    if (mimeType.includes('text/plain')) return 'Text';
    if (mimeType.includes('text/csv')) return 'CSV';
    
    // Image types
    if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) return 'JPEG';
    if (mimeType.includes('image/png')) return 'PNG';
    if (mimeType.includes('image/gif')) return 'GIF';
    if (mimeType.includes('image/svg')) return 'SVG';
    if (mimeType.includes('image/webp')) return 'WebP';
    
    // Archive types
    if (mimeType.includes('zip')) return 'ZIP';
    if (mimeType.includes('rar')) return 'RAR';
    if (mimeType.includes('7z')) return '7Z';
    
    // Video types
    if (mimeType.includes('video/mp4')) return 'MP4';
    if (mimeType.includes('video/avi')) return 'AVI';
    if (mimeType.includes('video/mov')) return 'MOV';
    
    // Audio types
    if (mimeType.includes('audio/mp3')) return 'MP3';
    if (mimeType.includes('audio/wav')) return 'WAV';
    
    // Fallback to file extension or generic label
    const extension = fileType.split('/')[1]?.toUpperCase();
    return extension?.length <= 5 ? extension : 'FILE';
  };

  const handleTogglePin = async () => {
    try {
      const newPinStatus = !document.is_pinned;
      
      const { error } = await supabase
        .from('documents')
        .update({ is_pinned: newPinStatus })
        .eq('id', document.id);

      if (error) throw error;

      toast.success(`Document ${newPinStatus ? 'pinned' : 'unpinned'} successfully`);
      onDocumentUpdated?.();
    } catch (error) {
      console.error('Pin toggle error:', error);
      toast.error('Failed to update document pin status');
    }
  };

  const handleDownload = async () => {
    try {
      // Use storage_id if available, otherwise fall back to file_path
      const pathToUse = document.storage_id || document.file_path;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(pathToUse);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.title;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      // Use storage_id if available, otherwise fall back to file_path
      const pathToUse = document.storage_id || document.file_path;
      
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([pathToUse]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      toast.success('Document deleted successfully');
      onDocumentDeleted();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <TooltipProvider>
      <Card className={`group transition-all duration-200 hover:shadow-lg border-border/50 h-full flex flex-col ${
        document.is_pinned 
          ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-md' 
          : 'hover:border-primary/20'
      }`}>
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                {getFileIcon(document.title, document.file_type)}
                {document.is_pinned && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary flex items-center justify-center">
                    <Pin className="h-2 w-2 text-primary-foreground" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug truncate cursor-default">
                      {document.title}
                    </h3>
                  </TooltipTrigger>
                  {document.title.length > 40 && (
                    <TooltipContent>
                      <p className="max-w-xs break-words">{document.title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {getFileTypeLabel(document.file_type)}
                  </Badge>
                  {document.folder && (
                    <Badge variant="outline" className="text-xs truncate max-w-24">
                      {document.folder}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="whitespace-nowrap">{format(new Date(document.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <HardDrive className="h-3 w-3 shrink-0" />
                <span className="whitespace-nowrap">{formatFileSize(document.size_bytes)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
            {canPin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePin}
                    className={`transition-all ${
                      document.is_pinned 
                        ? 'text-primary border-primary/50 hover:bg-primary/10' 
                        : 'hover:text-primary hover:border-primary/50'
                    }`}
                  >
                    {document.is_pinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{document.is_pinned ? 'Unpin document' : 'Pin document'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <DocumentViewer
                  documentPath={document.storage_id || document.file_path}
                  documentName={document.title}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:text-primary hover:border-primary/50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </DocumentViewer>
              </TooltipTrigger>
              <TooltipContent>
                <p>View document</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="hover:text-primary hover:border-primary/50"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download document</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="hover:text-destructive hover:border-destructive/50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete document</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default DocumentCard;