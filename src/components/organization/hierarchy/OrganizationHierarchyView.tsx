import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminHierarchySection } from './AdminHierarchySection';
import { TeamsHierarchySection } from './TeamsHierarchySection';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useTeamAccess } from '@/hooks/useTeamAccess';

export const OrganizationHierarchyView = () => {
  const { user } = useAuth();
  const { users, isLoading: usersLoading } = useOrganizationUsers();
  const { teams, isLoading: teamsLoading } = useTeamAccess();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const isLoading = usersLoading || teamsLoading;

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Get admin users (superadmin, admin, manager)
  const adminUsers = filteredUsers.filter(user => 
    ['superadmin', 'admin', 'manager'].includes(user.role)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || roleFilter !== 'all') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Admin Hierarchy Section */}
      <AdminHierarchySection 
        adminUsers={adminUsers}
        teams={teams}
        searchTerm={searchTerm}
      />

      {/* Teams Hierarchy Section */}
      <TeamsHierarchySection 
        teams={teams}
        allUsers={filteredUsers}
        searchTerm={searchTerm}
      />
    </div>
  );
};