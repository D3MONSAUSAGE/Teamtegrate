import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Settings
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function TrainingNavMenu() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  const mainTrainingItems = [
    {
      title: "My Training",
      url: "/dashboard/training/my-training",
      icon: GraduationCap,
    },
    {
      title: "Video Library", 
      url: "/dashboard/training/video-library",
      icon: Video,
    },
  ];

  const managementItems = canManageContent ? [
    {
      title: "Content",
      url: "/dashboard/training/management/content",
      icon: BookOpen,
    },
    {
      title: "Assignments",
      url: "/dashboard/training/management/assignments", 
      icon: Users,
    },
    {
      title: "Video Library",
      url: "/dashboard/training/management/video-library",
      icon: PlayCircle,
    },
    {
      title: "Employee Records",
      url: "/dashboard/training/management/employee-records",
      icon: FileText,
    },
    {
      title: "Certificates", 
      url: "/dashboard/training/management/certificates",
      icon: Award,
    },
    {
      title: "Retraining",
      url: "/dashboard/training/management/retraining",
      icon: RefreshCw,
    },
  ] : [];

  const analyticsItems = canManageContent ? [
    {
      title: "Analytics",
      url: "/dashboard/training/analytics", 
      icon: BarChart3,
    },
  ] : [];

  const isTrainingActive = currentPath.startsWith('/dashboard/training');
  const isManagementExpanded = currentPath.startsWith('/dashboard/training/management');

  const getNavClassName = (isActive: boolean) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Training</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Main Training Dashboard Link */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/dashboard/training" 
                end 
                className={({ isActive }) => getNavClassName(isActive)}
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                {!collapsed && <span>Training Dashboard</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Training Sections */}
          {mainTrainingItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  className={({ isActive }) => getNavClassName(isActive)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Analytics for Managers */}
          {analyticsItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  className={({ isActive }) => getNavClassName(isActive)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Management Section - Collapsible */}
          {canManageContent && !collapsed && (
            <Collapsible open={isManagementExpanded}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Management</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {managementItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild>
                          <NavLink 
                            to={item.url}
                            className={({ isActive }) => getNavClassName(isActive)}
                          >
                            <item.icon className="mr-2 h-3 w-3" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )}

          {/* Management Items for Collapsed State */}
          {canManageContent && collapsed && managementItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url}
                  className={({ isActive }) => getNavClassName(isActive)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}