
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AuditResult } from '../types';

interface AuditResultItemProps {
  result: AuditResult;
  index: number;
}

const AuditResultItem: React.FC<AuditResultItemProps> = ({ result, index }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
      {getStatusIcon(result.status)}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(result.status)}>
            {result.section}
          </Badge>
        </div>
        <p className="text-sm">{result.message}</p>
        {result.details && (
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer">View Details</summary>
            <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-40">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default AuditResultItem;
