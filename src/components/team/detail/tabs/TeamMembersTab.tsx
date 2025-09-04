import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  User, 
  UserPlus, 
  Search,
  MoreHorizontal,
  Crown,
  Shield,
  Mail,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TeamMembersTabProps {
  teamMembers: any[];
  isLoading: boolean;
}

const TeamMembersTab: React.FC<TeamMembersTabProps> = ({ teamMembers, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = teamMembers.filter(member => 
    member.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with search and add member */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Members Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-2xl font-bold text-primary">{teamMembers.length}</p>
          <p className="text-sm text-muted-foreground">Total Members</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {teamMembers.filter(m => m.role === 'manager').length}
          </p>
          <p className="text-sm text-muted-foreground">Managers</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">
            {teamMembers.filter(m => m.role === 'member').length}
          </p>
          <p className="text-sm text-muted-foreground">Members</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600">
            {teamMembers.filter(m => m.users).length}
          </p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No members found matching your search.' : 'No team members found.'}
          </div>
        ) : (
          filteredMembers.map((membership) => (
            <div key={membership.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {membership.users?.name || membership.users?.email || 'Unknown User'}
                    </h4>
                    {membership.role === 'manager' && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{membership.users?.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {format(new Date(membership.joined_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {membership.users?.role}
                  </Badge>
                  <Badge variant={membership.role === 'manager' ? 'default' : 'secondary'}>
                    {membership.role}
                  </Badge>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      {membership.role === 'manager' ? 'Remove Manager Role' : 'Make Manager'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Transfer to Another Team</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Remove from Team</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Actions */}
      {filteredMembers.length > 0 && (
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm">Bulk Transfer</Button>
          <Button variant="outline" size="sm">Export Members</Button>
        </div>
      )}
    </div>
  );
};

export default TeamMembersTab;