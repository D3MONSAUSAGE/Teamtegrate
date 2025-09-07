import { RequestType } from '@/types/requests';
import RequestWizard from './RequestWizard';
import { useEnhancedRequests } from '@/hooks/useEnhancedRequests';

interface RequestFormProps {
  requestTypes: RequestType[];
  onSuccess: () => void;
}

export default function RequestForm({ requestTypes, onSuccess }: RequestFormProps) {
  const { fetchRequests } = useEnhancedRequests();
  
  const handleSuccess = async () => {
    // Refresh the requests data to show the new request immediately
    await fetchRequests();
    onSuccess();
  };

  return (
    <RequestWizard 
      requestTypes={requestTypes} 
      onSuccess={handleSuccess}
      onCancel={onSuccess}
    />
  );
}