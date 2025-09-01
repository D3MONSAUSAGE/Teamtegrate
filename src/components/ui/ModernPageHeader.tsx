import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { LucideIcon } from 'lucide-react';

interface ModernPageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: LucideIcon;
  };
  stats?: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  badges?: Array<{
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }>;
}

const ModernPageHeader: React.FC<ModernPageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  actionButton,
  stats,
  badges
}) => {
  const currentTime = new Date();
  const formattedDate = format(currentTime, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(currentTime, 'h:mm a');

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/95 to-card/90 border shadow-lg backdrop-blur-sm">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-accent/5 via-primary/5 to-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/5 via-transparent to-background/5" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Content */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                  {title}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">{subtitle}</p>
              </div>
            </div>

            {/* Badges */}
            {badges && badges.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {badges.map((badge, index) => (
                  <Badge 
                    key={index}
                    variant={badge.variant || 'default'}
                    className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm"
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            {stats && stats.length > 0 && (
              <div className="flex items-center gap-6 pt-2">
                {stats.map((stat, index) => (
                  <React.Fragment key={index}>
                    <div className="group cursor-pointer">
                      <div className={`text-xl md:text-2xl font-bold ${stat.color || 'text-primary'} group-hover:scale-110 transition-transform`}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                    {index < stats.length - 1 && <div className="w-px h-8 bg-border" />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Custom children */}
            {children}
          </div>
          
          {/* Right Section - Date/Time & Actions */}
          <div className="flex-shrink-0 space-y-3">
            {/* Date and Time Display */}
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">{formattedDate}</div>
              <div className="text-2xl font-semibold text-primary">{formattedTime}</div>
            </div>
            
            {/* Action Button */}
            {actionButton && (
              <Button 
                onClick={actionButton.onClick}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full lg:w-auto"
                disabled={actionButton.disabled}
              >
                <div className="flex items-center gap-2">
                  {actionButton.icon && <actionButton.icon className="h-5 w-5" />}
                  {actionButton.label}
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernPageHeader;