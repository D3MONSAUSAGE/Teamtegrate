import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User as UserIcon, Settings, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

const mockNotifications = [
  {
    id: 1,
    text: "New task assigned: Fix sidebar styles",
    date: "2m ago"
  },
  {
    id: 2,
    text: "Time tracking reminder: Submit hours",
    date: "30m ago"
  },
  {
    id: 3,
    text: "Project deadline approaching: Sprint Update",
    date: "1d ago"
  }
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchAvatar = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Error fetching user avatar:', error);
            return;
          }

          if (data?.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        } catch (error) {
          console.error('Error fetching avatar:', error);
        }
      };

      fetchAvatar();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleSettings = () => {
    navigate('/dashboard/settings');
  };

  const handleNotificationsOpen = () => {
    setHasUnread(false);
  };

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-background border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4 md:space-x-0">
        <Link to="/" className="text-xl font-bold text-primary ml-10 md:ml-0">TeamStream</Link>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Notifications" onClick={handleNotificationsOpen}>
              <Bell className="h-5 w-5" />
              {hasUnread && (
                <span className="absolute top-2 right-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-2 pt-2 pb-1 text-sm font-semibold text-muted-foreground">Notifications</div>
            <DropdownMenuSeparator />
            {mockNotifications.length > 0 ? (
              mockNotifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-0.5 py-2 px-2 whitespace-normal">
                  <span>{notification.text}</span>
                  <span className="text-xs text-muted-foreground">{notification.date}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem className="text-center py-4">No notifications</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-sm text-gray-600 dark:text-gray-300 mr-2 hidden md:inline">
          {user.role === 'manager' ? 'Manager' : 'Team Member'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl || undefined} alt={user.name} />
                <AvatarFallback className="bg-primary text-white">
                  {user.name?.substring(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>{user.name}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2" onClick={handleSettings}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 text-red-500" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
