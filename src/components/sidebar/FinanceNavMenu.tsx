import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  BarChart3,
  FileText,
  Plus,
  Users,
  Settings,
  CreditCard,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface FinanceNavMenuProps {
  onNavigation?: () => void;
  isCollapsed?: boolean;
}

export const FinanceNavMenu: React.FC<FinanceNavMenuProps> = ({ 
  onNavigation, 
  isCollapsed = false 
}) => {
  const location = useLocation();
  const { hasRoleAccess } = useAuth();

  // Hide Finance menu from regular users
  if (!hasRoleAccess('team_leader')) {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(
    location.pathname.startsWith('/dashboard/finance')
  );

  // Main finance navigation items
  const financeItems = [
    {
      name: 'Dashboard',
      href: '/dashboard/finance/dashboard',
      icon: BarChart3,
    },
    {
      name: 'Invoice Management',
      href: '/dashboard/finance/invoices',
      icon: FileText,
    },
    {
      name: 'Create Invoice',
      href: '/dashboard/finance/create-invoice',
      icon: Plus,
      requiresRole: 'manager' as const,
    },
    {
      name: 'Clients',
      href: '/dashboard/finance/clients',
      icon: Users,
      requiresRole: 'manager' as const,
    },
    {
      name: 'Reports',
      href: '/dashboard/finance/reports',
      icon: BarChart3,
      requiresRole: 'manager' as const,
    },
    {
      name: 'Payment Settings',
      href: '/dashboard/finance/settings',
      icon: Settings,
      requiresRole: 'admin' as const,
    },
  ];

  const isActiveRoute = (itemHref: string, currentPath: string) => {
    return currentPath.startsWith(itemHref);
  };

  const currentPath = location.pathname;
  const isFinanceActive = currentPath.startsWith('/dashboard/finance');

  if (isCollapsed) {
    // In collapsed mode, just show the main finance icon
    return (
      <Link
        to="/dashboard/finance"
        onClick={onNavigation}
        className={cn(
          "group relative flex items-center justify-center rounded-lg p-3 text-sm font-medium transition-all duration-300 overflow-hidden",
          "hover:scale-[1.02] hover:shadow-md",
          isFinanceActive
            ? "bg-gradient-to-r from-primary/15 via-primary/10 to-accent/10 text-primary border-l-4 border-primary shadow-sm"
            : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:via-transparent hover:to-accent/5 hover:text-foreground hover:shadow-sm"
        )}
      >
        <div className={cn(
          "relative p-2 rounded-full transition-all duration-300 flex-shrink-0",
          isFinanceActive 
            ? "bg-gradient-to-r from-primary/20 to-accent/20 shadow-sm" 
            : "group-hover:bg-gradient-to-r group-hover:from-primary/10 group-hover:to-accent/10"
        )}>
          <DollarSign className={cn(
            "h-4 w-4 transition-all duration-300",
            isFinanceActive ? "text-primary scale-110" : "group-hover:scale-110"
          )} />
        </div>
        {isFinanceActive && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-sm animate-pulse" />
        )}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      {/* Main Finance Toggle */}
      <div className="flex items-center">
        <Link
          to="/dashboard/finance"
          onClick={onNavigation}
          className={cn(
            "group relative flex items-center rounded-lg p-3 text-sm font-medium transition-all duration-300 overflow-hidden flex-1",
            "hover:scale-[1.02] hover:shadow-md space-x-3",
            isFinanceActive
              ? "bg-gradient-to-r from-primary/15 via-primary/10 to-accent/10 text-primary border-l-4 border-primary shadow-sm"
              : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:via-transparent hover:to-accent/5 hover:text-foreground hover:shadow-sm"
          )}
        >
          <div className={cn(
            "relative p-2 rounded-full transition-all duration-300 flex-shrink-0",
            isFinanceActive 
              ? "bg-gradient-to-r from-primary/20 to-accent/20 shadow-sm" 
              : "group-hover:bg-gradient-to-r group-hover:from-primary/10 group-hover:to-accent/10"
          )}>
            <DollarSign className={cn(
              "h-4 w-4 transition-all duration-300",
              isFinanceActive ? "text-primary scale-110" : "group-hover:scale-110"
            )} />
          </div>
          <span className={cn(
            "truncate font-medium transition-all duration-300",
            isFinanceActive && "bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent font-semibold"
          )}>
            Finance
          </span>
        </Link>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "p-1 rounded hover:bg-muted transition-colors",
            isFinanceActive ? "text-primary" : "text-muted-foreground"
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
          {financeItems.map((item) => {
            // Filter items based on role access
            if (item.requiresRole && !hasRoleAccess(item.requiresRole)) {
              return null;
            }

            const isActive = isActiveRoute(item.href, currentPath);

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onNavigation}
                className={cn(
                  "group relative flex items-center rounded-lg p-2 text-sm transition-all duration-200 space-x-2",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 transition-all duration-200",
                  isActive ? "text-primary" : "group-hover:scale-105"
                )} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};