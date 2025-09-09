import { RequestType } from '@/types/requests';
import RequestWizard from './RequestWizard';
import { useEnhancedRequests } from '@/hooks/useEnhancedRequests';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RequestFormProps {
  requestTypes: RequestType[];
  onSuccess: () => void;
}

export default function RequestForm({ requestTypes, onSuccess }: RequestFormProps) {
  const { fetchRequests } = useEnhancedRequests();
  const [error, setError] = useState<string | null>(null);
  
  const handleSuccess = async () => {
    try {
      setError(null);
      // Refresh the requests data to show the new request immediately
      await fetchRequests();
      onSuccess();
    } catch (err) {
      console.error('Error refreshing requests after creation:', err);
      setError('Request created successfully, but failed to refresh the list. Please refresh the page.');
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (requestTypes.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No request types are available. Please contact your administrator to set up request types.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <RequestWizard 
        requestTypes={requestTypes} 
        onSuccess={handleSuccess}
        onError={handleError}
        onCancel={onSuccess}
      />
    </div>
  );
}