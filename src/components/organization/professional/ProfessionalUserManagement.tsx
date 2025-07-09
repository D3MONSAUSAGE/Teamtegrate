
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Users, 
  Filter,
  SortAsc,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Grid3X3,
  List,
  Settings
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfessionalUserCard from './ProfessionalUserCard';
import ProfessionalUserGrid from './ProfessionalUserGrid';
import { useOrganizationTeamMembers } from '@/hooks/useOrganizationTeamMembers';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProfessionalUserManagementProps {
  onViewProfile: (userId: string) => void;
  onEditUser: (user: any) => void;
  onDeleteUser: (user: any) => void;
  onCreateUser: () => void;
}

const ProfessionalUserManagement: React.FC<ProfessionalUserManagementProps> = ({
  onViewProfile,
  onEditUser,
  onDeleteUser,
  onCreateUser
}) => {
  const { user: currentUser } = useAuth();
  const { users, isLoading, error, refetch } = useOrganizationTeamMembers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'date'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort users
  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });

    // Sort users
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || a.email).localeCompare(b.name || b.email);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'date':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [users, searchTerm, roleFilter, sortBy]);

  const roleStats = React.useMemo(() => {
    const stats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: users.length,
      superadmin: stats.superadmin || 0,
      admin: stats.admin || 0,
      manager: stats.manager || 0,
      user: stats.user || 0
    };
  }, [users]);

  const canManageUsers = currentUser && ['superadmin', 'admin'].includes(currentUser.role);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Users className="h-6 w-6 text-primary" />
              Team Management
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg text-muted-foreground">Loading team members...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Users className="h-6 w-6 text-primary" />
              Team Management
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                {filteredAndSortedUsers.length} Members
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground">
              Manage your organization's team members, roles, and permissions
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {canManageUsers && (
              <Button onClick={onCreateUser} className="bg-primary hover:bg-primary/90">
                <Users className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{roleStats.total}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total</div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{roleStats.superadmin}</div>
              <div className="text-sm text-red-600 dark:text-red-400 font-medium">Superadmin</div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-orange-200 dark:border-orange-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{roleStats.admin}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Admin</div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{roleStats.manager}</div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">Manager</div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{roleStats.user}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">User</div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-900/50 dark:to-gray-900/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/80 backdrop-blur-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 bg-background/80 backdrop-blur-sm">
                  <Filter className="h-4 w-4 mr-2" />
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
              
              <Select value={sortBy} onValueChange={(value: 'name' | 'role' | 'date') => setSortBy(value)}>
                <SelectTrigger className="w-32 bg-background/80 backdrop-blur-sm">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-lg bg-background/80 backdrop-blur-sm">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* User Grid/List */}
        {filteredAndSortedUsers.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No team members found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Add team members to get started with collaboration.'
                }
              </p>
              {canManageUsers && !searchTerm && roleFilter === 'all' && (
                <Button onClick={onCreateUser}>
                  <Users className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <ProfessionalUserGrid
            users={filteredAndSortedUsers}
            viewMode={viewMode}
            onViewProfile={onViewProfile}
            onEditUser={onEditUser}
            onDeleteUser={onDeleteUser}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ProfessionalUserManagement;
