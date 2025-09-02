import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Video, 
  ExternalLink, 
  Image, 
  FileType,
  Download,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { OnboardingResource } from '@/types/resources';
import { useOnboardingResources } from '@/hooks/onboarding/useOnboardingResources';
import { formatDistanceToNow } from 'date-fns';

interface ResourceCardProps {
  resource: OnboardingResource;
}

const getResourceIcon = (type: OnboardingResource['resource_type']) => {
  switch (type) {
    case 'document': return FileText;
    case 'video': return Video;
    case 'link': return ExternalLink;
    case 'image': return Image;
    case 'template': return FileType;
    default: return FileText;
  }
};

const getCategoryColor = (category: OnboardingResource['category']) => {
  switch (category) {
    case 'hr_documentation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'compliance_training': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'job_specific_training': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'culture_engagement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'general': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const { deleteResource, getResourceUrl, isDeleting } = useOnboardingResources();
  const [showFullDescription, setShowFullDescription] = useState(false);

  const ResourceIcon = getResourceIcon(resource.resource_type);
  const resourceUrl = getResourceUrl(resource);
  const isExternal = !!resource.external_url;

  const handleView = () => {
    if (resourceUrl) {
      window.open(resourceUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (resourceUrl && !isExternal) {
      const link = document.createElement('a');
      link.href = resourceUrl;
      link.download = resource.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const truncatedDescription = resource.description && resource.description.length > 100 
    ? resource.description.substring(0, 100) + '...' 
    : resource.description;

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <ResourceIcon className="h-5 w-5 text-primary flex-shrink-0" />
            <CardTitle className="text-sm font-medium truncate">{resource.title}</CardTitle>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge className={getCategoryColor(resource.category)} variant="secondary">
            {resource.category.replace('_', ' ')}
          </Badge>
          <Badge variant="outline">{resource.resource_type}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          {resource.description && (
            <CardDescription className="mb-3">
              {showFullDescription ? resource.description : truncatedDescription}
              {resource.description.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary hover:underline ml-1"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </CardDescription>
          )}

          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {resource.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              Created {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })}
            </div>
            {resource.file_size && (
              <div>{formatFileSize(resource.file_size)}</div>
            )}
            {isExternal && (
              <div className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                External Link
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            disabled={!resourceUrl}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          
          {!isExternal && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!resourceUrl}
            >
              <Download className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteResource(resource.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};