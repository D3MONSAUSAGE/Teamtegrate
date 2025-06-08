
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  CheckSquare, 
  FolderKanban,  
  Users, 
  BarChart3,
  Timer,
  FileText,
  DollarSign,
  MessageSquare,
  BookOpen,
  Calendar,
  User
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowed: boolean;
}

interface SidebarNavProps {
  onNavigation?: () => void;
  isCollapsed?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Profile",
    path: "/dashboard/profile",
    icon: User,
    allowed: true,
  },
  {
    name: "Projects",
    path: "/dashboard/projects",
    icon: FolderKanban,
    allowed: true,
  },
  {
    name: "My Tasks",
    path: "/dashboard/tasks",
    icon: CheckSquare,
    allowed: true,
  },
  {
    name: "Calendar",
    path: "/dashboard/calendar",
    icon: Calendar,
    allowed: true,
  },
  {
    name: "Time Tracking",
    path: "/dashboard/time-tracking",
    icon: Timer,
    allowed: true,
  },
  {
    name: "Team",
    path: "/dashboard/team",
    icon: Users,
    allowed: true,
  },
  {
    name: "Reports",
    path: "/dashboard/reports",
    icon: BarChart3,
    allowed: true,
  },
  {
    name: "Finance",
    path: "/dashboard/finance",
    icon: DollarSign,
    allowed: true,
  },
  {
    name: "Documents",
    path: "/dashboard/documents",
    icon: FileText,
    allowed: true,
  },
  {
    name: "Notebook",
    path: "/dashboard/notebook",
    icon: BookOpen,
    allowed: true,
  },
  {
    name: "Team Chat",
    path: "/dashboard/chat",
    icon: MessageSquare,
    allowed: true,
  }
];

const SidebarNav: React.FC<SidebarNavProps> = ({ onNavigation, isCollapsed = false }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    if (onNavigation) onNavigation();
  };

  return (
    <TooltipProvider>
      <div className="px-2 py-4">
        <div className={cn(
          "space-y-1 transition-all duration-300",
          isCollapsed && "space-y-2"
        )}>
          {navItems.map((item) => {
            if (!item.allowed) return null;

            const isActiveItem = isActive(item.path);
            const IconComponent = item.icon;

            const NavButton = (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200",
                  "hover:bg-muted hover:text-primary",
                  isActiveItem && "bg-primary text-primary-foreground",
                  isCollapsed ? "justify-center px-2" : "justify-start"
                )}
              >
                <IconComponent className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActiveItem && "text-black"
                )} />
                {!isCollapsed && (
                  <span className="transition-opacity duration-300">{item.name}</span>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {NavButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavButton;
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SidebarNav;
