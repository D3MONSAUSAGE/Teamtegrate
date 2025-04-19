
import React, { useEffect, useState } from 'react';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentList from '@/components/documents/DocumentList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Define the DocumentItem type to match our updated interface in DocumentList
interface DocumentItem {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  created_at: string;
  size_bytes: number;
}

const DocumentsPage = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        toast.error('Error loading documents');
        return;
      }

      setDocuments(data || []);
    } catch (err) {
      console.error('Exception fetching documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      <div className="space-y-6">
        <DocumentUploader onUploadComplete={fetchDocuments} />
        <DocumentList 
          documents={documents} 
          onDocumentDeleted={fetchDocuments} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
};

export default DocumentsPage;
