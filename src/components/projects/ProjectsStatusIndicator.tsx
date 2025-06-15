
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, Wifi } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectsStatusIndicatorProps {
  isShowingCached: boolean;
  isStale: boolean;
  lastSuccessfulFetch: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const ProjectsStatusIndicator: React.FC<ProjectsStatusIndicatorProps> = ({
  isShowingCached,
  isStale,
  lastSuccessfulFetch,
  onRefresh,
  isLoading
}) => {
  if (!isShowingCached && !isStale) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isShowingCached ? (
            <Wifi className="h-4 w-4 text-amber-600" />
          ) : (
            <Clock className="h-4 w-4 text-amber-600" />
          )}
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {isShowingCached ? 'Offline Mode' : 'Data may be outdated'}
            </Badge>
            
            {lastSuccessfulFetch && (
              <span className="text-sm text-amber-700 dark:text-amber-300">
                Last updated {formatDistanceToNow(lastSuccessfulFetch, { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={isLoading}
        className="border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/20"
      >
        <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );
};

export default ProjectsStatusIndicator;
