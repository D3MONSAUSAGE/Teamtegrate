
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuditResult } from './audit/types';
import { 
  performAuthenticationAudit,
  performDatabaseAudit,
  performRLSAudit,
  performOrganizationDataAudit
} from './audit/utils/auditHelpers';
import UserContextCard from './audit/components/UserContextCard';
import AuditResultsList from './audit/components/AuditResultsList';
import RawDataInspector from './audit/components/RawDataInspector';

const SystemAuditPanel = () => {
  const { user, isAuthenticated } = useAuth();
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [rawData, setRawData] = useState<any>({});

  const addResult = (section: string, status: 'success' | 'warning' | 'error', message: string, details?: any) => {
    setAuditResults(prev => [...prev, { section, status, message, details }]);
  };

  const runSystemAudit = async () => {
    setIsRunning(true);
    setAuditResults([]);
    setRawData({});

    try {
      // 1. Authentication & Context Setup
      const authSuccess = await performAuthenticationAudit(user, isAuthenticated, addResult);
      if (!authSuccess) {
        setIsRunning(false);
        return;
      }

      // 2. Direct database queries to verify data existence
      const dbResults = await performDatabaseAudit(addResult);

      // 3. Test RLS policies
      await performRLSAudit(addResult);

      // 4. Check for data in specific organization
      await performOrganizationDataAudit(user, addResult);

      // Store raw data for inspection
      setRawData({
        user,
        ...dbResults
      });

    } catch (error: any) {
      addResult('System', 'error', `Audit failed: ${error.message}`, error);
    }

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Audit Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runSystemAudit} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running Audit...' : 'Run Complete System Audit'}
            </Button>

            <UserContextCard user={user} />
            <AuditResultsList auditResults={auditResults} />
            <RawDataInspector rawData={rawData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAuditPanel;
