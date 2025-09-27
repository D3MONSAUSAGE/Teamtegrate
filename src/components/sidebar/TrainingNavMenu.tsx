import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  GraduationCap, 
  Video, 
  BarChart3, 
  BookOpen, 
  Users, 
  Award,
  RefreshCw,
  FileText,
  PlayCircle,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface TrainingNavMenuProps {
  onNavigation?: () => void;
  isCollapsed?: boolean;
}

export const TrainingNavMenu: React.FC<TrainingNavMenuProps> = ({ 
  onNavigation, 
  isCollapsed = false 
}) => {
  const location = useLocation();
  const { hasRoleAccess } = useAuth();
  const [isExpanded, setIsExpanded] = useState(
    location.pathname.startsWith('/dashboard/training')
  );

  // Main training navigation items
  const trainingItems = [
    {
      name: 'My Training',
      href: '/dashboard/training/my-training',
      icon: GraduationCap,
    },
    {
      name: 'Video Library',
      href: '/dashboard/training/video-library',
      icon: Video,
    },
    {
      name: 'Analytics',
      href: '/dashboard/training/analytics',
      icon: BarChart3,
      requiresRole: 'manager' as const,
    },
    {
      name: 'Management',
      href: '/dashboard/training/management',
      icon: Settings,
      requiresRole: 'manager' as const,
      subItems: [
        {
          name: 'Content',
          href: '/dashboard/training/management/content',
          icon: BookOpen,
        },
        {
          name: 'Assignments',
          href: '/dashboard/training/management/assignments',
          icon: Users,
        },
        {
          name: 'Video Library',
          href: '/dashboard/training/management/video-library',
          icon: PlayCircle,
        },
        {
          name: 'Employee Records',
          href: '/dashboard/training/management/employee-records',
          icon: FileText,
        },
        {
          name: 'Certificates',
          href: '/dashboard/training/management/certificates',
          icon: Award,
        },
        {
          name: 'Retraining',
          href: '/dashboard/training/management/retraining',
          icon: RefreshCw,
        },
      ],
    },
  ];

  const isActiveRoute = (itemHref: string, currentPath: string) => {
    return currentPath.startsWith(itemHref);
  };

  const currentPath = location.pathname;
  const isTrainingActive = currentPath.startsWith('/dashboard/training');

  if (isCollapsed) {
    // In collapsed mode, just show the main training icon
    return (
      <Link
        to="/dashboard/training"
        onClick={onNavigation}
        className={cn(
          "group relative flex items-center justify-center rounded-lg p-3 text-sm font-medium transition-all duration-300 overflow-hidden",
          "hover:scale-[1.02] hover:shadow-md",
          isTrainingActive
            ? "bg-gradient-to-r from-primary/15 via-primary/10 to-accent/10 text-primary border-l-4 border-primary shadow-sm"
            : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:via-transparent hover:to-accent/5 hover:text-foreground hover:shadow-sm"
        )}
      >
        <div className={cn(
          "relative p-2 rounded-full transition-all duration-300 flex-shrink-0",
          isTrainingActive 
            ? "bg-gradient-to-r from-primary/20 to-accent/20 shadow-sm" 
            : "group-hover:bg-gradient-to-r group-hover:from-primary/10 group-hover:to-accent/10"
        )}>
          <GraduationCap className={cn(
            "h-4 w-4 transition-all duration-300",
            isTrainingActive ? "text-primary scale-110" : "group-hover:scale-110"
          )} />
        </div>
        {isTrainingActive && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-sm animate-pulse" />
        )}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      {/* Main Training Toggle */}
      <div className="flex items-center">
        <Link
          to="/dashboard/training"
          onClick={onNavigation}
          className={cn(
            "group relative flex items-center rounded-lg p-3 text-sm font-medium transition-all duration-300 overflow-hidden flex-1",
            "hover:scale-[1.02] hover:shadow-md space-x-3",
            isTrainingActive
              ? "bg-gradient-to-r from-primary/15 via-primary/10 to-accent/10 text-primary border-l-4 border-primary shadow-sm"
              : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:via-transparent hover:to-accent/5 hover:text-foreground hover:shadow-sm"
          )}
        >
          <div className={cn(
            "relative p-2 rounded-full transition-all duration-300 flex-shrink-0",
            isTrainingActive 
              ? "bg-gradient-to-r from-primary/20 to-accent/20 shadow-sm" 
              : "group-hover:bg-gradient-to-r group-hover:from-primary/10 group-hover:to-accent/10"
          )}>
            <GraduationCap className={cn(
              "h-4 w-4 transition-all duration-300",
              isTrainingActive ? "text-primary scale-110" : "group-hover:scale-110"
            )} />
          </div>
          <span className={cn(
            "truncate font-medium transition-all duration-300",
            isTrainingActive && "bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-semibold"
          )}>
            Training
          </span>
        </Link>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "p-1 rounded hover:bg-muted transition-colors",
            isTrainingActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded submenu */}
      {isExpanded && (
        <div className="ml-4 pl-4 border-l border-border/50 space-y-1">
          {trainingItems.map((item) => {
            // Filter items based on role access
            if (item.requiresRole && !hasRoleAccess(item.requiresRole)) {
              return null;
            }

            const isActive = isActiveRoute(item.href, currentPath);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isSubItemActive = hasSubItems && item.subItems.some(subItem => 
              isActiveRoute(subItem.href, currentPath)
            );

            return (
              <div key={item.href}>
                <Link
                  to={item.href}
                  onClick={onNavigation}
                  className={cn(
                    "group relative flex items-center rounded-lg p-2 text-sm transition-all duration-200 space-x-2",
                    isActive || isSubItemActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-all duration-200",
                    isActive || isSubItemActive ? "text-primary" : "group-hover:scale-105"
                  )} />
                  <span className="truncate">{item.name}</span>
                </Link>

                {/* Management sub-items */}
                {hasSubItems && (isActive || isSubItemActive) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subItems?.map((subItem) => {
                      const isSubActive = isActiveRoute(subItem.href, currentPath);
                      return (
                        <Link
                          key={subItem.href}
                          to={subItem.href}
                          onClick={onNavigation}
                          className={cn(
                            "group relative flex items-center rounded-lg p-2 text-sm transition-all duration-200 space-x-2",
                            isSubActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <subItem.icon className={cn(
                            "h-3 w-3 transition-all duration-200",
                            isSubActive ? "text-primary" : "group-hover:scale-105"
                          )} />
                          <span className="truncate text-xs">{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};