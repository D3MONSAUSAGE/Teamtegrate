
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search, Filter } from 'lucide-react';

interface ProjectsSearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount: number;
}

const ProjectsSearchSection: React.FC<ProjectsSearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  resultsCount
}) => {
  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-card/95 via-card/90 to-card/85 border-2 border-border/30 shadow-xl rounded-3xl p-8 hover:shadow-2xl hover:border-primary/40 transition-all duration-500">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-2xl">
          <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
            <Search className="h-5 w-5" />
          </div>
          <Input
            placeholder="Search your projects by name or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-14 h-14 rounded-2xl border-2 border-border/50 bg-background/60 backdrop-blur-sm focus:border-primary/60 focus:bg-background/80 transition-all duration-300 text-lg font-medium shadow-inner hover:shadow-lg focus:shadow-xl"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium backdrop-blur-sm border border-primary/20">
              {resultsCount} project{resultsCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/30 backdrop-blur-sm">
            <Filter className="h-4 w-4 inline mr-2" />
            All Projects
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsSearchSection;
