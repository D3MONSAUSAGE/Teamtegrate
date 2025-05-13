
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DatabaseErrorAlertProps {
  hasError: boolean;
}

const DatabaseErrorAlert: React.FC<DatabaseErrorAlertProps> = ({ hasError }) => {
  if (!hasError) return null;
  
  return (
    <div className="p-4 mb-4 rounded border-red-300 border bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 flex items-center gap-2">
      <AlertTriangle className="h-5 w-5" />
      <div>
        <p className="font-semibold">Database connection issues detected</p>
        <p className="text-sm">There may be RLS policy recursion errors in your Supabase project.</p>
      </div>
    </div>
  );
};

export default DatabaseErrorAlert;
