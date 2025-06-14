
import React from 'react';
import { FileIcon, ImageIcon, DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
}

interface ChatMessageAttachmentProps {
  attachment: Attachment;
}

const ChatMessageAttachment: React.FC<ChatMessageAttachmentProps> = ({ attachment }) => {
  const isImage = attachment.file_type.startsWith('image/');

  const handleDownload = () => {
    // Implement download logic
    window.open(attachment.file_path, '_blank');
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
      {isImage ? (
        <ImageIcon className="h-4 w-4" />
      ) : (
        <FileIcon className="h-4 w-4" />
      )}
      <span className="text-sm truncate flex-1">{attachment.file_name}</span>
      <Button variant="ghost" size="icon" onClick={handleDownload}>
        <DownloadIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatMessageAttachment;
