import React from 'react';
import { VideoLibrary } from '@/components/training/video-library/VideoLibrary';
import { TrainingBreadcrumb } from '@/components/training/navigation/TrainingBreadcrumb';
import TrainingErrorBoundary from '@/components/training/TrainingErrorBoundary';

export function VideoLibraryPage() {
  return (
    <TrainingErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <TrainingBreadcrumb 
            items={[
              { label: 'Training', href: '/dashboard/training' },
              { label: 'Video Library', href: '/dashboard/training/video-library' }
            ]} 
          />

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Video Library</h1>
            <p className="text-muted-foreground">
              Browse and watch training videos to enhance your skills and knowledge.
            </p>
          </div>

          <VideoLibrary />
        </div>
      </div>
    </TrainingErrorBoundary>
  );
}