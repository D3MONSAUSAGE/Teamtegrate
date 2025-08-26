
import React, { useState } from 'react';
import { FileIcon, ImageIcon, DownloadIcon, Eye, Volume2, PlayIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from './ImageLightbox';
import { AudioPlayer } from './AudioPlayer';

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
}

interface ChatMessageAttachmentProps {
  attachment: Attachment;
  allImages?: Attachment[];
}

const ChatMessageAttachment: React.FC<ChatMessageAttachmentProps> = ({ 
  attachment, 
  allImages = [] 
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImage = attachment.file_type.startsWith('image/');
  const isAudio = attachment.file_type.startsWith('audio/');
  const isVideo = attachment.file_type.startsWith('video/');
  
  const imageAttachments = allImages.filter(att => att.file_type.startsWith('image/'));
  const currentImageIndex = imageAttachments.findIndex(att => att.id === attachment.id);

  const handleDownload = async () => {
    try {
      const response = await fetch(attachment.file_path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      window.open(attachment.file_path, '_blank');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isAudio) {
    return (
      <div className="max-w-sm">
        <AudioPlayer
          audioUrl={attachment.file_path}
          fileName={attachment.file_name}
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="max-w-sm">
        <video
          src={attachment.file_path}
          controls
          className="rounded-lg border max-w-full h-auto"
          preload="metadata"
        >
          Your browser does not support the video element.
        </video>
        <div className="mt-1">
          <p className="text-xs text-muted-foreground truncate">{attachment.file_name}</p>
        </div>
      </div>
    );
  }

  if (isImage) {
    return (
      <>
        <div className="relative group max-w-sm">
          <img
            src={attachment.file_path}
            alt={attachment.file_name}
            className="rounded-lg border max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setLightboxOpen(true)}
          />
          
          {/* Image Overlay Controls */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-background/80 hover:bg-background"
                onClick={() => setLightboxOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-background/80 hover:bg-background"
                onClick={handleDownload}
              >
                <DownloadIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* File Info */}
          <div className="mt-1">
            <p className="text-xs text-muted-foreground truncate">{attachment.file_name}</p>
          </div>
        </div>

        {lightboxOpen && imageAttachments.length > 0 && (
          <ImageLightbox
            images={imageAttachments.map(att => ({
              url: att.file_path,
              name: att.file_name,
              alt: att.file_name
            }))}
            initialIndex={currentImageIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 max-w-sm">
      {isAudio ? (
        <Volume2 className="h-8 w-8 text-primary flex-shrink-0" />
      ) : isVideo ? (
        <PlayIcon className="h-8 w-8 text-primary flex-shrink-0" />
      ) : (
        <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
        <p className="text-xs text-muted-foreground">
          {/* Note: file_size not in current schema, will add if needed */}
          {attachment.file_type}
        </p>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon"
        className="flex-shrink-0"
        onClick={handleDownload}
      >
        <DownloadIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatMessageAttachment;
