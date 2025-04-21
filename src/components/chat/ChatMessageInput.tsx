import React, { useRef } from 'react';
import { Paperclip, Send, Mic, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EmojiPickerButton from './EmojiPickerButton';

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
}

const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  newMessage,
  setNewMessage,
  fileUploads,
  setFileUploads,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFileUploads(files.map(file => ({ file, progress: 0 })));
  };

  const removeFile = (index: number) => {
    setFileUploads(current => current.filter((_, i) => i !== index));
  };

  const insertAtCursor = (text: string) => {
    if (!inputRef.current) {
      setNewMessage(newMessage + text);
      return;
    }
    const start = inputRef.current.selectionStart ?? newMessage.length;
    const end = inputRef.current.selectionEnd ?? newMessage.length;
    setNewMessage(
      newMessage.slice(0, start) + text + newMessage.slice(end)
    );
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd = start + text.length;
        inputRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="p-4 border-t border-border dark:border-gray-800 bg-card dark:bg-[#1f2133] space-y-3">
      <div className="flex flex-wrap gap-2">
        {fileUploads.map((upload, index) => (
          <div key={index} className="flex items-center gap-2 bg-muted dark:bg-[#181928]/70 p-2 rounded-full">
            <span className="text-sm truncate max-w-[150px]">{upload.file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-background/50 dark:hover:bg-gray-800/50"
              onClick={() => removeFile(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <Input
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          ref={fileInputRef}
          multiple
        />
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="pr-24 rounded-full bg-muted dark:bg-[#181928]/70 border-border dark:border-gray-800"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <EmojiPickerButton onEmojiClick={insertAtCursor} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => toast.info("Voice messages coming soon!")}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full h-10 w-10 flex-shrink-0 bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatMessageInput;
