
import { Loader2 } from 'lucide-react';

export const ProjectsLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-gray-500">Loading projects...</p>
    </div>
  );
};
