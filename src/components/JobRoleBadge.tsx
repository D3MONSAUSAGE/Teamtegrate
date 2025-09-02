import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Briefcase } from 'lucide-react';

interface JobRoleBadgeProps {
  roleName: string;
  isPrimary?: boolean;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const JobRoleBadge: React.FC<JobRoleBadgeProps> = ({ 
  roleName, 
  isPrimary = false, 
  size = 'sm',
  showIcon = true 
}) => {
  return (
    <Badge
      variant={isPrimary ? "default" : "secondary"}
      className={`
        ${size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'}
        ${isPrimary 
          ? 'bg-primary/10 text-primary border-primary/20 font-medium' 
          : 'bg-muted/80 text-muted-foreground border-muted-foreground/20'
        }
        flex items-center gap-1.5 w-fit
      `}
    >
      {showIcon && <Briefcase className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      <span>{roleName}</span>
      {isPrimary && <span className="text-xs opacity-75">(Primary)</span>}
    </Badge>
  );
};

export default JobRoleBadge;