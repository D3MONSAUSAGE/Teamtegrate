
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  Crown, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Calendar,
  Eye
} from 'lucide-react';
import { Team } from '@/types/teams';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface TeamCardProps {
  team: Team;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
  onManageMembers?: (team: Team) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onEdit,
  onDelete,
  onManageMembers,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.role && ['superadmin', 'admin'].includes(user.role);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown trigger
    if ((e.target as Element).closest('[data-dropdown-trigger]')) {
      return;
    }
    navigate(`/dashboard/organization/teams/${team.id}`);
  };

  const handleViewDetails = () => {
    navigate(`/dashboard/organization/teams/${team.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary flex-shrink-0" />
              <h3 className="font-semibold truncate">{team.name}</h3>
              <Badge variant="outline" className="text-xs">
                {team.member_count} member{team.member_count !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {team.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {team.description}
              </p>
            )}
            
            <div className="space-y-1 text-xs text-muted-foreground">
              {team.manager_name && (
                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <span>Manager: {team.manager_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Created {format(new Date(team.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-dropdown-trigger>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border shadow-md">
                <DropdownMenuLabel>Team Actions</DropdownMenuLabel>
                
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onManageMembers?.(team)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Members
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onEdit?.(team)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Team
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => onDelete?.(team)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{team.member_count} total members</span>
            {team.manager_name ? (
              <span className="text-green-600">Managed</span>
            ) : (
              <span className="text-orange-600">No manager</span>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCard;
