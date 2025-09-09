import SimpleRequestForm from './SimpleRequestForm';

interface RequestFormProps {
  requestTypes: any[];
  onSuccess: () => void;
}

export default function RequestForm({ requestTypes, onSuccess }: RequestFormProps) {
  return <SimpleRequestForm onSuccess={onSuccess} />;
}