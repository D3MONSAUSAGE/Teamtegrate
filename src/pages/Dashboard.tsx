
import React from 'react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Hello {user?.name || user?.email}, you're successfully logged in.
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>User ID:</strong> {user?.id}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your dashboard is ready! You can now start building your application features.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
