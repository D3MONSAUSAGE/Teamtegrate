import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban,  
  Users, 
  Settings,
  BarChart3,
  Timer,
  Clock,
  FileText,
  DollarSign,
  MessageSquare,
  ListChecks
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  allowed: boolean;
}

interface SidebarNavProps {
  onNavigation?: () => void;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "Projects",
    path: "/dashboard/projects",
    icon: <FolderKanban className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "My Tasks",
    path: "/dashboard/tasks",
    icon: <CheckSquare className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "Time Tracking",
    path: "/dashboard/time-tracking",
    icon: <Timer className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "Timeline",
    path: "/dashboard/timeline",
    icon: <Clock className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "Team",
    path: "/dashboard/team",
    icon: <Users className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "Reports",
    path: "/dashboard/reports",
    icon: <BarChart3 className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "Finance",
    path: "/dashboard/finance",
    icon: <DollarSign className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "Documents",
    path: "/dashboard/documents",
    icon: <FileText className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "Team Chat",
    path: "/dashboard/chat",
    icon: <MessageSquare className="h-5 w-5" />,
    allowed: true,
  },
  {
    name: "Settings",
    path: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
    allowed: true,
  },
];

const SidebarNav: React.FC<SidebarNavProps> = ({ onNavigation }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    if (onNavigation) onNavigation();
  };

  return (
    <div className="flex-1 px-4 overflow-y-auto">
      <ul className="space-y-2">
        {navItems.map((item) => {
          if (!item.allowed) return null;

          const isActiveItem = isActive(item.path);

          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-base font-medium transition-all duration-200 focus:outline-none",
                  isActiveItem
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background text-foreground hover:bg-muted hover:text-primary focus:ring-2 focus:ring-primary"
                )}
                style={{
                  letterSpacing: "0.02em",
                }}
              >
                <span
                  className={cn(
                    "flex items-center justify-center",
                    isActiveItem
                      ? "text-primary-foreground"
                      : "text-primary group-hover:text-primary group-focus:text-primary"
                  )}
                >
                  {React.cloneElement(item.icon as JSX.Element, {
                    className: cn(
                      "w-6 h-6",
                      isActiveItem
                        ? "stroke-[2.2] text-primary-foreground"
                        : "stroke-[2.2] text-primary"
                    ),
                  })}
                </span>
                <span
                  className={cn(
                    "ml-2",
                    isActiveItem
                      ? "text-primary-foreground font-bold"
                      : "text-foreground font-semibold"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SidebarNav;
