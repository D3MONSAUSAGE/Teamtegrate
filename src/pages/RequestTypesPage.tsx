import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, Loader2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { hasRoleAccess } from '@/contexts/auth/roleUtils';
import RequestTypeManager from '@/components/organization/requests/RequestTypeManager';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';

const RequestTypesPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
              <div className="absolute inset-0 h-16 w-16 mx-auto rounded-full bg-primary/20 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Loading Request Types</h3>
            <p className="text-muted-foreground">Preparing your request management...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has required permissions (manager or higher)
  if (!user || !hasRoleAccess(user.role, 'manager')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <Alert className="max-w-md mx-auto border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access request type management. Manager role or higher is required.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/organization')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organization
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Request Type Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Configure and manage request types for your organization
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
              <AlertCircle className="h-4 w-4" />
              <span>Manager Access Required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/10 px-3 py-1.5 rounded-full">
              <Briefcase className="h-4 w-4" />
              <span>Organization Settings</span>
            </div>
          </div>
        </div>

        {/* Request Type Manager */}
        <ModernSectionCard
          title="Request Types"
          icon={AlertCircle}
          gradient="from-blue-500/10 via-purple-500/10 to-indigo-500/10"
        >
          <RequestTypeManager />
        </ModernSectionCard>
      </div>
    </div>
  );
};

export default RequestTypesPage;