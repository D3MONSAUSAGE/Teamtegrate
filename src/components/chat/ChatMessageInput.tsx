
import React, { useRef, useState } from 'react';
import { Paperclip, Send, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EmojiPickerButton from './EmojiPickerButton';
import MentionInput from './MentionInput';
import { FileDropZone } from './FileDropZone';
import { VoiceRecorder } from './VoiceRecorder';
import { VoiceRecording } from '@/hooks/useVoiceRecorder';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFileUpload } from '@/hooks/useFileUpload';

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

interface ChatMessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSubmit: (e: React.FormEvent, attachmentUrls?: string[]) => Promise<void>;
  replyTo?: any;
  setReplyTo?: (msg: any | null) => void;
  isSending?: boolean;
  roomId: string;
}

const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  newMessage,
  setNewMessage,
  onSubmit,
  replyTo,
  setReplyTo,
  isSending = false,
  roomId
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  const {
    uploads,
    isUploading,
    addFiles,
    removeFile,
    uploadAll,
    clearUploads,
    hasValidFiles
  } = useFileUpload();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertAtCursor = (text: string) => {
    setNewMessage(newMessage + text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSending || isUploading) {
      return;
    }
    
    try {
      let attachmentUrls: string[] = [];
      
      // Upload files if any
      if (hasValidFiles) {
        const uploadedFiles = await uploadAll(roomId);
        attachmentUrls = uploadedFiles
          .filter(f => f.url)
          .map(f => f.url!);
      }
      
      await onSubmit(e, attachmentUrls);
      clearUploads();
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error('Failed to send message');
    }
  };

  const handleVoiceRecordingComplete = async (recording: VoiceRecording) => {
    console.log('Processing voice recording...', { duration: recording.duration, hasTranscript: !!recording.transcript });
    try {
      // Create a voice file from the recording
      const voiceFile = new File([recording.audioBlob], `voice_${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      
      console.log('Voice file created:', { name: voiceFile.name, size: voiceFile.size, type: voiceFile.type });
      
      // Add to uploads and upload immediately
      addFiles([voiceFile]);
      console.log('Voice file added to uploads, starting upload...');
      const uploadedFiles = await uploadAll(roomId);
      console.log('Voice upload completed:', uploadedFiles);
      
      if (uploadedFiles.length > 0) {
        const attachmentUrls = uploadedFiles
          .filter(f => f.url)
          .map(f => f.url!);
        
        // Create a synthetic event for onSubmit
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {}
        } as React.FormEvent;
        
        // Send with transcript as message content if available
        const messageContent = recording.transcript || 'Voice message';
        const originalMessage = newMessage;
        setNewMessage(messageContent);
        
        await onSubmit(syntheticEvent, attachmentUrls);
        
        // Restore original message if it existed
        setNewMessage(originalMessage);
      }
      
      setShowVoiceRecorder(false);
      clearUploads();
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast.error('Failed to send voice message');
    }
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

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <div className="mb-3">
          <VoiceRecorder
            isActive={showVoiceRecorder}
            onRecordingComplete={handleVoiceRecordingComplete}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}

      {uploads.length > 0 && (
        <div className="mb-3">
          <FileDropZone
            uploads={uploads}
            onFilesAdded={addFiles}
            onFileRemoved={removeFile}
            disabled={isSending || isUploading}
          />
        </div>
      )}
      
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
            disabled={isSending || isUploading}
          >
            <Paperclip className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-muted-foreground`} />
          </Button>
          
          <MentionInput
            value={newMessage}
            onChange={setNewMessage}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending || isUploading}
            className={`border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 flex-1 resize-none ${isMobile ? 'text-base' : 'text-sm'} min-h-[40px] max-h-[120px]`}
            roomId={roomId}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'} rounded-full flex-shrink-0`}
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            disabled={isSending || isUploading}
          >
            <Mic className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} ${showVoiceRecorder ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
        </div>
        
        <Button 
          type="submit" 
          size="icon" 
          className={`rounded-full ${isMobile ? 'h-12 w-12' : 'h-10 w-10'} flex-shrink-0 bg-primary hover:bg-primary/90`}
          disabled={(!newMessage.trim() && !hasValidFiles) || isSending || isUploading}
        >
          <Send className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} ${isSending || isUploading ? 'opacity-50' : ''}`} />
        </Button>
      </form>
    </div>
  );
};

export default ChatMessageInput;
