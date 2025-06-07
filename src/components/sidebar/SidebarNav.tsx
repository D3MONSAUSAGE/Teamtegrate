
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
  Calendar
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowed: boolean;
}

interface SidebarNavProps {
  onNavigation?: () => void;
}

const navItems: NavItem[] = [
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

const SidebarNav: React.FC<SidebarNavProps> = ({ onNavigation }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    if (onNavigation) onNavigation();
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => {
            if (!item.allowed) return null;

            const isActiveItem = isActive(item.path);
            const IconComponent = item.icon;

            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActiveItem}
                  tooltip={item.name}
                >
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    className="flex items-center gap-3"
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarNav;
