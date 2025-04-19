
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ChevronLeft, Paperclip, FileText, FileImage, X, Mic } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import ChatMessageAvatar from './ChatMessageAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatRoomProps {
  room: {
    id: string;
    name: string;
  };
  onBack?: () => void;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  type: 'text' | 'system';
  attachments?: {
    id: string;
    file_name: string;
    file_type: string;
    file_path: string;
  }[];
}

interface FileUpload {
  file: File;
  progress: number;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ room, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
    scrollToBottom();
  }, [room.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data);
    scrollToBottom();
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFileUploads(files.map(file => ({ file, progress: 0 })));
  };

  const removeFile = (index: number) => {
    setFileUploads(current => current.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File) => {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user?.id}/${timestamp}-${file.name}`;

    const { error: uploadError, data } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Failed to upload file');
      throw uploadError;
    }

    return {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: filePath
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && fileUploads.length === 0) || !user) return;

    try {
      let attachments = [];
      if (fileUploads.length > 0) {
        attachments = await Promise.all(fileUploads.map(upload => uploadFile(upload.file)));
      }

      const { error: messageError, data: messageData } = await supabase
        .from('chat_messages')
        .insert({
          room_id: room.id,
          user_id: user.id,
          content: newMessage.trim() || 'Shared attachments',
          type: 'text',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      if (attachments.length > 0) {
        const { error: attachmentError } = await supabase
          .from('chat_message_attachments')
          .insert(
            attachments.map(attachment => ({
              message_id: messageData.id,
              ...attachment
            }))
          );

        if (attachmentError) throw attachmentError;
      }

      setNewMessage('');
      setFileUploads([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const renderAttachment = (attachment: Message['attachments'][0]) => {
    const isImage = attachment.file_type.startsWith('image/');
    const url = `${supabase.storage.from('chat-attachments').getPublicUrl(attachment.file_path).data.publicUrl}`;

    return (
      <a
        key={attachment.id}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-2 mt-2 bg-muted rounded hover:bg-muted/80 transition-colors"
      >
        {isImage ? (
          <FileImage className="inline-block mr-2 h-4 w-4" />
        ) : (
          <FileText className="inline-block mr-2 h-4 w-4" />
        )}
        {attachment.file_name}
      </a>
    );
  };

  return (
    <Card className="flex flex-col h-full border-none shadow-none bg-background">
      <div className="p-4 border-b flex items-center gap-2 bg-card">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="font-semibold">{room.name}</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message) => {
            const isCurrentUser = message.user_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <ChatMessageAvatar 
                  userId={message.user_id}
                  className="mt-0.5 flex-shrink-0 w-8 h-8"
                />
                <div
                  className={`group relative max-w-[85%] sm:max-w-[75%] ${
                    isCurrentUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-3xl break-words ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.attachments?.map(attachment => renderAttachment(attachment))}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-card space-y-3">
        <div className="flex flex-wrap gap-2">
          {fileUploads.map((upload, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-full">
              <span className="text-sm truncate max-w-[150px]">{upload.file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 hover:bg-background/50"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <Input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            ref={fileInputRef}
            multiple
          />
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="pr-24 rounded-full bg-muted border-0"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
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
          <Button type="submit" size="icon" className="rounded-full h-10 w-10 flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ChatRoom;
