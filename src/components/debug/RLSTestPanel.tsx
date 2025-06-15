
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { debugRLSPolicies, clearAllCaches } from '@/utils/rlsDebugger';
import { RefreshCw, Bug, Trash2 } from 'lucide-react';

const RLSTestPanel = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);

  const runRLSTest = async () => {
    if (!user?.id || !user?.organizationId) {
      console.error('Cannot run RLS test without authenticated user');
      return;
    }

    setIsRunning(true);
    try {
      await debugRLSPolicies(user.id, user.organizationId);
    } catch (error) {
      console.error('RLS test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearCaches = () => {
    clearAllCaches();
    window.location.reload();
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          RLS Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p><strong>User:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Org:</strong> {user.organizationId}</p>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={runRLSTest} 
            disabled={isRunning}
            className="w-full"
            variant="outline"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Bug className="h-4 w-4 mr-2" />
                Test RLS Policies
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleClearCaches}
            className="w-full"
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache & Reload
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Check browser console for detailed RLS test results
        </p>
      </CardContent>
    </Card>
  );
};

export default RLSTestPanel;
