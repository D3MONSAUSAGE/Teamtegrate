
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompactSectionHeaderProps {
  title: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
  onAction?: () => void;
  actionLabel?: string;
  viewAllLink?: string;
}

const CompactSectionHeader: React.FC<CompactSectionHeaderProps> = ({
  title,
  count,
  icon: Icon,
  onAction,
  actionLabel = "Add",
  viewAllLink
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="p-1 rounded bg-primary/10">
            <Icon className="h-3 w-3 text-primary" />
          </div>
        )}
        <h2 className="text-sm font-semibold text-foreground">
          {title}
          {count !== undefined && (
            <span className="ml-1 text-xs text-muted-foreground">({count})</span>
          )}
        </h2>
      </div>
      
      <div className="flex items-center gap-1">
        {viewAllLink && (
          <Link to={viewAllLink}>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              View all
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
        {onAction && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onAction}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CompactSectionHeader;
