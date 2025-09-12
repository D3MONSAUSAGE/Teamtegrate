/**
 * Native Navigation Component
 * Platform-aware navigation with native styling and behavior
 */

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSafeArea } from './SafeAreaProvider';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { isIOS, isAndroid } from '@/lib/platform';
import { Home, MessageSquare, Calendar, FileText, Settings, Users, BarChart3 } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  badge?: number;
}

interface NativeNavigationProps {
  items?: NavItem[];
  className?: string;
}

const defaultNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
    path: '/dashboard',
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageSquare className="w-5 h-5" />,
    path: '/dashboard/chat',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <Calendar className="w-5 h-5" />,
    path: '/dashboard/calendar',
  },
  {
    id: 'documents',
    label: 'Files',
    icon: <FileText className="w-5 h-5" />,
    path: '/dashboard/documents',
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users className="w-5 h-5" />,
    path: '/dashboard/team',
  },
];

const NativeNavigation: React.FC<NativeNavigationProps> = ({
  items = defaultNavItems,
  className,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bottomSafeArea } = useSafeArea();
  const { triggerSelectionHaptic } = useNativeFeatures();

  const handleNavigation = async (path: string) => {
    await triggerSelectionHaptic();
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  const getNavigationStyle = () => {
    if (isIOS) {
      return {
        paddingBottom: `max(${bottomSafeArea}px, 12px)`,
        backdropFilter: 'blur(20px)',
        backgroundColor: 'hsl(var(--background) / 0.8)',
      };
    }

    if (isAndroid) {
      return {
        paddingBottom: `max(${bottomSafeArea}px, 8px)`,
        backgroundColor: 'hsl(var(--background))',
      };
    }

    return {
      paddingBottom: `max(${bottomSafeArea}px, 8px)`,
    };
  };

  const getItemClasses = (active: boolean) => {
    const baseClasses = [
      'flex', 'flex-col', 'items-center', 'justify-center',
      'min-h-[60px]', 'px-2', 'py-1',
      'mobile-touch-target', 'mobile-focus',
      'transition-all', 'duration-200',
      'cursor-pointer',
    ];

    if (isIOS) {
      baseClasses.push('ios-feedback');
      if (active) {
        baseClasses.push('text-primary');
      } else {
        baseClasses.push('text-muted-foreground', 'hover:text-foreground');
      }
    } else if (isAndroid) {
      baseClasses.push('material-ripple', 'rounded-lg');
      if (active) {
        baseClasses.push('text-primary', 'bg-primary/10');
      } else {
        baseClasses.push('text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50');
      }
    } else {
      baseClasses.push('touch-feedback', 'rounded-lg');
      if (active) {
        baseClasses.push('text-primary', 'bg-primary/10');
      } else {
        baseClasses.push('text-muted-foreground', 'hover:text-foreground', 'hover:bg-muted/50');
      }
    }

    return baseClasses;
  };

  return (
    <nav 
      className={cn(
        'fixed', 'bottom-0', 'left-0', 'right-0',
        'border-t', 'border-border',
        'flex', 'items-center', 'justify-around',
        'px-2', 'pt-2',
        'z-50',
        isIOS && 'ios-blur',
        isAndroid && 'material-elevation-2',
        className
      )}
      style={getNavigationStyle()}
    >
      {items.map((item) => {
        const active = isActive(item.path);
        
        return (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={cn(getItemClasses(active))}
            aria-label={item.label}
          >
            <div className="relative">
              {item.icon}
              {item.badge && item.badge > 0 && (
                <span className={cn(
                  'absolute', '-top-2', '-right-2',
                  'min-w-[16px]', 'h-4',
                  'bg-destructive', 'text-destructive-foreground',
                  'text-xs', 'font-medium',
                  'rounded-full',
                  'flex', 'items-center', 'justify-center',
                  'px-1'
                )}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className={cn(
              'text-xs', 'font-medium', 'mt-1',
              'line-clamp-1'
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default NativeNavigation;