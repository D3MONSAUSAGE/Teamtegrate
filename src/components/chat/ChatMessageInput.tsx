
import React, { useRef } from 'react';
import { Paperclip, Send, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EmojiPickerButton from './EmojiPickerButton';
import MentionInput from './MentionInput';
import { useIsMobile } from '@/hooks/use-mobile';

function ReplyPreview({ message, onCancel }: { message: any, onCancel: () => void }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 bg-accent/20 dark:bg-accent/10 p-3 rounded-t-lg border-l-4 border-primary/70">
      <div className="truncate text-sm font-medium text-foreground flex-1">
        Replying to: <span className="italic text-muted-foreground">"{message.content?.slice(0, 80)}"</span>
      </div>
      <button
        aria-label="Cancel reply"
        className="ml-auto rounded-full hover:bg-background/80 p-1.5 transition flex-shrink-0"
        onClick={onCancel}
        type="button"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

interface FileUpload {
  file: File;
  progress: number;
}

interface ChatMessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  fileUploads: FileUpload[];
  setFileUploads: React.Dispatch<React.SetStateAction<FileUpload[]>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  replyTo?: any;
  setReplyTo?: (msg: any | null) => void;
  isSending?: boolean;
  roomId: string;
}

const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  newMessage,
  setNewMessage,
  fileUploads,
  setFileUploads,
  onSubmit,
  replyTo,
  setReplyTo,
  isSending = false,
  roomId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFileUploads(files.map(file => ({ file, progress: 0 })));
  };

  const removeFile = (index: number) => {
    setFileUploads(current => current.filter((_, i) => i !== index));
  };

  const insertAtCursor = (text: string) => {
    setNewMessage(newMessage + text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSending) {
      return;
    }
    
    await onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className={`p-3 md:p-4 bg-card dark:bg-[#1f2133] border-t border-border dark:border-gray-800 ${isMobile ? 'pb-safe' : ''}`}>
      {replyTo && setReplyTo && (
        <ReplyPreview message={replyTo} onCancel={() => setReplyTo(null)} />
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {fileUploads.map((upload, index) => (
          <div key={index} className="flex items-center gap-2 bg-accent/20 dark:bg-accent/10 px-3 py-2 rounded-full">
            <span className="text-sm truncate max-w-[150px]">{upload.file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-background/50 dark:hover:bg-background/20 rounded-full p-1"
              onClick={() => removeFile(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          ref={fileInputRef}
          multiple
        />
        
        <div className="flex bg-muted dark:bg-[#262d45] rounded-2xl p-1 pl-3 flex-1 min-h-[48px] items-center">
          <EmojiPickerButton onEmojiClick={insertAtCursor} />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} rounded-full flex-shrink-0`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Paperclip className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-muted-foreground`} />
          </Button>
          
          <MentionInput
            value={newMessage}
            onChange={setNewMessage}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending}
            className={`border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 flex-1 resize-none ${isMobile ? 'text-base' : 'text-sm'} min-h-[40px] max-h-[120px]`}
            roomId={roomId}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} rounded-full flex-shrink-0`}
            onClick={() => toast.info("Voice messages coming soon!")}
            disabled={isSending}
          >
            <Mic className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-muted-foreground`} />
          </Button>
        </div>
        
        <Button 
          type="submit" 
          size="icon" 
          className={`rounded-full ${isMobile ? 'h-12 w-12' : 'h-10 w-10'} flex-shrink-0 bg-primary hover:bg-primary/90`}
          disabled={(!newMessage.trim() && fileUploads.length === 0) || isSending}
        >
          <Send className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} ${isSending ? 'opacity-50' : ''}`} />
        </Button>
      </form>
    </div>
  );
};

export default ChatMessageInput;
