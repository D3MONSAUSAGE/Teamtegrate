import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, TrendingUp, Calendar, User } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { User as AppUser } from '@/types';
import { format } from 'date-fns';

interface ReportsHeaderProps {
  currentUser: AppUser;
  selectedUser?: AppUser;
  timeRange: string;
  onBackToPersonal: () => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  currentUser,
  selectedUser,
  timeRange,
  onBackToPersonal
}) => {
  const { isDark, toggle } = useDarkMode();
  const viewingUser = selectedUser || currentUser;
  const isViewingSelf = !selectedUser || selectedUser.id === currentUser.id;

  return (
    <Card className="border-0 shadow-none bg-gradient-to-r from-card via-card/95 to-primary/5 animate-fade-in">
      <div className="p-6 space-y-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={viewingUser.avatar_url} alt={viewingUser.name} />
                <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {viewingUser.name?.charAt(0) || viewingUser.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {!isViewingSelf && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {isViewingSelf ? 'My Performance Dashboard' : `${viewingUser.name}'s Performance`}
                </h1>
                {!isViewingSelf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBackToPersonal}
                    className="text-xs"
                  >
                    Back to My Data
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Analyzing {timeRange.toLowerCase()} performance</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="px-3 py-1">
              {viewingUser.role.toUpperCase()}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="h-9 w-9"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Reports</span>
          <span>/</span>
          <span className="font-medium text-foreground">
            {isViewingSelf ? 'Personal Dashboard' : `Team Member: ${viewingUser.name}`}
          </span>
          <span>/</span>
          <span className="font-medium text-primary">{timeRange}</span>
        </div>
      </div>
    </Card>
  );
};