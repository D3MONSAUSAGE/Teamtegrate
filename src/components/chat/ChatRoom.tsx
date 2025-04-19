import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ChevronLeft, Paperclip, FileText, FileImage, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

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
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="font-semibold">{room.name}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.user_id === user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.user_id === user?.id
                  ? 'bg-primary text-primary-foreground ml-12'
                  : 'bg-muted mr-12'
              }`}
            >
              <p className="text-sm break-words">{message.content}</p>
              {message.attachments?.map(attachment => renderAttachment(attachment))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t space-y-2">
        <div className="flex flex-wrap gap-2">
          {fileUploads.map((upload, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded">
              <span className="text-sm truncate max-w-[150px]">{upload.file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            ref={fileInputRef}
            multiple
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ChatRoom;
