import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VideoLibraryManager } from '@/components/training/video-library/VideoLibraryManager';
import { TrainingBreadcrumb } from '@/components/training/navigation/TrainingBreadcrumb';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

export function VideoLibraryAdminPage() {
  const { user } = useAuth();
  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  if (!canManageContent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to manage the video library.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TrainingErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <TrainingBreadcrumb 
            items={[
              { label: 'Training', href: '/dashboard/training' },
              { label: 'Management', href: '/dashboard/training/management' },
              { label: 'Video Library', href: '/dashboard/training/management/video-library' }
            ]} 
          />

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Video Library Administration</h1>
            <p className="text-muted-foreground">
              Upload, organize, and manage training videos for your organization.
            </p>
          </div>

          <VideoLibraryManager />
        </div>
      </div>
    </TrainingErrorBoundary>
  );
}