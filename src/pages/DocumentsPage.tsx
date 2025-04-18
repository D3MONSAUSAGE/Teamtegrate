
import React, { useEffect, useState } from 'react';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentList from '@/components/documents/DocumentList';
import { supabase } from '@/integrations/supabase/client';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    setDocuments(data);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      <div className="space-y-6">
        <DocumentUploader onUploadComplete={fetchDocuments} />
        <DocumentList documents={documents} onDocumentDeleted={fetchDocuments} />
      </div>
    </div>
  );
};

export default DocumentsPage;
