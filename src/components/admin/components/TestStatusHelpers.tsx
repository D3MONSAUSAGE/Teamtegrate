
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TestResult } from '../types';

export const getStatusIcon = (result?: TestResult) => {
  if (!result) return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  return result.success 
    ? <CheckCircle className="h-4 w-4 text-green-500" />
    : <XCircle className="h-4 w-4 text-red-500" />;
};

export const getStatusBadge = (result?: TestResult) => {
  if (!result) return <Badge variant="outline">Not Run</Badge>;
  return result.success 
    ? <Badge variant="default" className="bg-green-500">Passed</Badge>
    : <Badge variant="destructive">Failed</Badge>;
};
