
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

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
    <div className="glass-card border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-card/95 dark:via-card/90 dark:to-card/85 backdrop-blur-2xl rounded-3xl p-8 hover:shadow-2xl transition-all duration-300">
      <div className="relative max-w-md">
        <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <Input
          placeholder="Search your projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-14 h-14 rounded-2xl border-2 border-border/50 bg-background/60 backdrop-blur-sm focus:border-primary/60 focus:bg-background/80 transition-all duration-300 text-lg font-medium shadow-inner hover:shadow-lg"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
            {resultsCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsSearchSection;
