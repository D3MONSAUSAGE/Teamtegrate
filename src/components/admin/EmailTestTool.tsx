import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function EmailTestTool() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testEmail, setTestEmail] = useState(user?.email || '');

  const runSmokeTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      console.log('[Smoke Test] Starting email smoke test...');
      
      const testPayload = {
        type: 'ticket_created',
        ticket: {
          id: `TEST-${Date.now()}`,
          title: 'Email Pipeline Smoke Test',
          description: 'This is a test to verify the email system is working correctly.',
          status: 'submitted',
          priority: 'medium',
          created_at: new Date().toISOString(),
          organization_id: user?.organizationId || ''
        },
        user: {
          id: user?.id || '',
          email: testEmail,
          name: user?.name || 'Test User'
        },
        timestamp: new Date().toISOString()
      };

      console.log('[Smoke Test] Sending test payload:', testPayload);

      const { data, error } = await supabase.functions.invoke('send-ticket-notifications', {
        body: testPayload
      });

      if (error) {
        console.error('[Smoke Test] Error:', error);
        setResult({
          success: false,
          error: error.message || error,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('[Smoke Test] Success:', data);
        setResult({
          success: true,
          data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('[Smoke Test] Unexpected error:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  // Only show to admin users
  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Email System Test
          <Badge variant="outline">Admin Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-email">Test Email Address</Label>
          <Input
            id="test-email"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email to test"
          />
        </div>
        
        <Button 
          onClick={runSmokeTest} 
          disabled={testing || !testEmail}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Run Email Smoke Test'}
        </Button>

        {result && (
          <div className={`p-3 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="font-semibold mb-2">
              {result.success ? '✅ Test Successful' : '❌ Test Failed'}
            </div>
            <div className="text-sm">
              <div>Time: {result.timestamp}</div>
              {result.success ? (
                <div className="mt-2">
                  <div>Emails Sent: {result.data?.emailsSent || 0}</div>
                  <div>Push Sent: {result.data?.pushNotificationsSent || 0}</div>
                  <div>Email Errors: {result.data?.emailErrors || 0}</div>
                  <div>Push Errors: {result.data?.pushErrors || 0}</div>
                  <div className="mt-2 text-xs text-green-600">
                    Check your email and the Resend dashboard for delivery confirmation.
                  </div>
                </div>
              ) : (
                <div className="mt-2 font-mono text-xs">
                  Error: {result.error}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div>• This test sends a real email to the specified address</div>
          <div>• Check Resend dashboard for delivery status</div>
          <div>• FROM address should be support@requests.teamtegrate.com</div>
        </div>
      </CardContent>
    </Card>
  );
}