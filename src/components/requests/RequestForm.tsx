import { RequestType } from '@/types/requests';
import RequestWizard from './RequestWizard';

interface RequestFormProps {
  requestTypes: RequestType[];
  onSuccess: () => void;
}

export default function RequestForm({ requestTypes, onSuccess }: RequestFormProps) {
  return (
    <RequestWizard 
      requestTypes={requestTypes} 
      onSuccess={onSuccess}
      onCancel={onSuccess}
    />
  );
}