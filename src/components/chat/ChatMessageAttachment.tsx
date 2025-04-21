
import React from 'react';
import { FileImage, FileText, Download } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface AttachmentProps {
  attachment: {
    id: string;
    file_name: string;
    file_type: string;
    file_path: string;
  };
}

const ChatMessageAttachment: React.FC<AttachmentProps> = ({ attachment }) => {
  const isImage = attachment.file_type.startsWith('image/');
  const url = supabase.storage.from('chat-attachments').getPublicUrl(attachment.file_path).data.publicUrl;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 shadow-sm border border-accent/20 mb-1 hover:shadow-md transition hover:scale-[1.02] group max-w-full"
      style={{ minWidth: 0 }}
    >
      <div
        className={`flex-shrink-0 rounded-lg w-10 h-10 flex items-center justify-center bg-gradient-to-tr ${
          isImage
            ? 'from-primary/80 to-primary/60'
            : 'from-accent/80 to-accent/60'
        } shadow`}
      >
        {isImage ? <FileImage className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <div className="truncate font-medium text-sm text-gray-900 dark:text-white">
            {attachment.file_name}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.file_name}
            className="ml-2 rounded-full hover:bg-accent hover:text-primary transition-colors p-1"
            title="Download file"
          >
            <Download className="h-4 w-4 text-primary" />
          </a>
        </div>
        <div className="text-xs text-muted-foreground pt-0.5">
          {isImage ? 'Image' : (attachment.file_type.split('/')[1]?.toUpperCase() || 'File')}
        </div>
        {isImage && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2 rounded-lg overflow-hidden border border-muted/30 hover:shadow-lg transition-all" title="Preview image">
            <img
              src={url}
              alt={attachment.file_name}
              className="w-48 max-h-36 object-cover transition-transform group-hover:scale-105"
              style={{ background: "#f6f1fb" }}
            />
          </a>
        )}
      </div>
    </div>
  );
};

export default ChatMessageAttachment;

