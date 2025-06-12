
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { AuditResult } from '../types';
import AuditResultItem from './AuditResultItem';

interface AuditResultsListProps {
  auditResults: AuditResult[];
}

const AuditResultsList: React.FC<AuditResultsListProps> = ({ auditResults }) => {
  if (auditResults.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Audit Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {auditResults.map((result, index) => (
            <AuditResultItem key={index} result={result} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditResultsList;
