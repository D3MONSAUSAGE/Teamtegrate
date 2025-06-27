
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Table2, 
  Grid,
  UserCheck,
  Shield,
  Crown
} from 'lucide-react';
import UserCard from './UserCard';
import { UserRole } from '@/types';

interface PaginatedUserListProps {
  users: any[];
  updatingUserId: string | null;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onEditUser: (user: any) => void;
  onDeleteUser: (user: any) => void;
}

const PaginatedUserList: React.FC<PaginatedUserListProps> = ({
  users,
  updatingUserId,
  onRoleChange,
  onEditUser,
  onDeleteUser
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Paginate filtered users
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, pageSize]);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin': return <Shield className="h-3 w-3 text-blue-500" />;
      case 'manager': return <UserCheck className="h-3 w-3 text-green-500" />;
      default: return <Users className="h-3 w-3 text-gray-500" />;
    }
  };

  const roleCounts = {
    superadmin: users.filter(u => u.role === 'superadmin').length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    user: users.filter(u => u.role === 'user').length,
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Crown className="h-3 w-3 text-yellow-500" />
            Super: {roleCounts.superadmin}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-500" />
            Admin: {roleCounts.admin}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-green-500" />
            Manager: {roleCounts.manager}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3 text-gray-500" />
            User: {roleCounts.user}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Table2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="superadmin">
                <div className="flex items-center gap-2">
                  {getRoleIcon('superadmin')}
                  Super Admin
                </div>
              </SelectItem>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  {getRoleIcon('admin')}
                  Admin
                </div>
              </SelectItem>
              <SelectItem value="manager">
                <div className="flex items-center gap-2">
                  {getRoleIcon('manager')}
                  Manager
                </div>
              </SelectItem>
              <SelectItem value="user">
                <div className="flex items-center gap-2">
                  {getRoleIcon('user')}
                  User
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filteredUsers.length)} of {filteredUsers.length} users
        </span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Fixed Height Scrollable User List Container */}
      <div className="border rounded-lg bg-card">
        <ScrollArea className="h-[500px] w-full">
          <div className="p-4">
            <div className={viewMode === 'grid' ? 'grid gap-4' : 'space-y-2'}>
              {paginatedUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  updatingUserId={updatingUserId}
                  onRoleChange={onRoleChange}
                  onEditUser={onEditUser}
                  onDeleteUser={onDeleteUser}
                  compact={viewMode === 'table'}
                />
              ))}
            </div>

            {/* No Results Message Inside Scroll Area */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'No users match your filters' 
                    : 'No users found'
                  }
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Pagination Controls - Outside of Scroll Area */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaginatedUserList;
