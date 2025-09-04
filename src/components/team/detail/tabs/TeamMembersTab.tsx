import React, { useState, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  UserPlus, 
  Search,
  MoreHorizontal,
  Crown,
  Shield,
  Mail,
  Calendar,
  Filter,
  Download,
  Users,
  ArrowUpDown,
  Trash2,
  UserCheck,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleAccess } from '@/contexts/auth/hooks/useRoleAccess';
import { useRealTeamMembers } from '@/hooks/team/useRealTeamMembers';
import { useTeamMemberOperations } from '@/hooks/organization/team/useTeamMemberOperations';
import AddUserToTeamDialog from '@/components/organization/team/AddUserToTeamDialog';
import { BulkTeamManagement } from '@/components/team/BulkTeamManagement';
import { TeamTransferDialog } from '@/components/team/TeamTransferDialog';

interface TeamMembersTabProps {
  team: {
    id: string;
    name: string;
    description?: string;
  };
}

type SortField = 'name' | 'email' | 'role' | 'joined_at' | 'completionRate' | 'totalTasks';
type SortOrder = 'asc' | 'desc';
type FilterRole = 'all' | 'manager' | 'member';
type FilterStatus = 'all' | 'active' | 'inactive';

const TeamMembersTab: React.FC<TeamMembersTabProps> = ({ team }) => {
  const { user } = useAuth();
  const { hasRoleAccess, canManageUser } = useRoleAccess(user);
  const { teamMembers, isLoading, refetch } = useRealTeamMembers(team.id);
  const { 
    removeTeamMember, 
    updateTeamMemberRole, 
    bulkTransferMembers 
  } = useTeamMemberOperations();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [transferMember, setTransferMember] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // Permissions
  const canManage = hasRoleAccess('manager');

  // Filtered and sorted members
  const filteredMembers = useMemo(() => {
    let filtered = teamMembers.filter(member => {
      const matchesSearch = 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || member.role === filterRole;
      
      // For now, treat all members as active (can be enhanced with real activity tracking)
      const matchesStatus = filterStatus === 'all' || filterStatus === 'active';
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role === 'manager' ? 1 : 0;
          bValue = b.role === 'manager' ? 1 : 0;
          break;
        case 'joined_at':
          aValue = new Date(a.joined_at).getTime();
          bValue = new Date(b.joined_at).getTime();
          break;
        case 'completionRate':
          aValue = a.completionRate || 0;
          bValue = b.completionRate || 0;
          break;
        case 'totalTasks':
          aValue = a.totalTasks || 0;
          bValue = b.totalTasks || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [teamMembers, searchTerm, filterRole, filterStatus, sortField, sortOrder]);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)));
    }
  }, [selectedMembers.size, filteredMembers]);

  const handleSelectMember = useCallback((memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  }, [selectedMembers]);

  // Member operations
  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeTeamMember(team.id, memberId);
      refetch();
      setMemberToRemove(null);
      // Remove from selection if selected
      const newSelected = new Set(selectedMembers);
      newSelected.delete(memberId);
      setSelectedMembers(newSelected);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'manager' | 'member') => {
    try {
      await updateTeamMemberRole(team.id, memberId, newRole);
      refetch();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  // Bulk operations
  const handleBulkRemove = async () => {
    try {
      await Promise.all(
        Array.from(selectedMembers).map(memberId => 
          removeTeamMember(team.id, memberId)
        )
      );
      refetch();
      setSelectedMembers(new Set());
      toast.success(`${selectedMembers.size} members removed`);
    } catch (error) {
      toast.error('Failed to remove members');
    }
  };

  const handleBulkRoleChange = async (newRole: 'manager' | 'member') => {
    try {
      await Promise.all(
        Array.from(selectedMembers).map(memberId => 
          updateTeamMemberRole(team.id, memberId, newRole)
        )
      );
      refetch();
      setSelectedMembers(new Set());
      toast.success(`${selectedMembers.size} members updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update member roles');
    }
  };

  // Export functionality
  const handleExport = useCallback(() => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Joined', 'Total Tasks', 'Completion Rate', 'Overdue Tasks'].join(','),
      ...filteredMembers.map(member => [
        `"${member.name}"`,
        `"${member.email}"`,
        member.role,
        format(new Date(member.joined_at), 'yyyy-MM-dd'),
        member.totalTasks,
        `${member.completionRate}%`,
        member.overdueTasks
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-${team.name}-members.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredMembers, team.name]);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Advanced Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Filters */}
            <Select value={filterRole} onValueChange={(value: FilterRole) => setFilterRole(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="manager">Managers</SelectItem>
                <SelectItem value="member">Members</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
            
            {canManage && (
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedMembers.size > 0 && canManage && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">
              {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkRoleChange('manager')}>
                <Crown className="h-3 w-3 mr-1" />
                Make Manager
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkRoleChange('member')}>
                <UserCheck className="h-3 w-3 mr-1" />
                Make Member
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBulkDialog(true)}>
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Transfer
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkRemove}>
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Members Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{teamMembers.length}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
            <Users className="h-8 w-8 text-primary/60" />
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {teamMembers.filter(m => m.role === 'manager').length}
              </p>
              <p className="text-sm text-muted-foreground">Managers</p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500/60" />
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {teamMembers.filter(m => m.role === 'member').length}
              </p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
            <User className="h-8 w-8 text-green-500/60" />
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(teamMembers.reduce((sum, m) => sum + (m.completionRate || 0), 0) / Math.max(teamMembers.length, 1))}%
              </p>
              <p className="text-sm text-muted-foreground">Avg Completion</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500/60" />
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {teamMembers.reduce((sum, m) => sum + (m.totalTasks || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
            <Activity className="h-8 w-8 text-orange-500/60" />
          </div>
        </div>
      </div>

      {/* Enhanced Members List */}
      <div className="space-y-2">
        {/* Header Row with Sorting */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg text-sm font-medium text-muted-foreground">
          {canManage && (
            <Checkbox 
              checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
              onCheckedChange={handleSelectAll}
              className="mr-2"
            />
          )}
          <div className="flex-1 flex items-center gap-1 cursor-pointer" onClick={() => handleSort('name')}>
            Member
            {sortField === 'name' && <ArrowUpDown className="h-3 w-3" />}
          </div>
          <div className="w-24 text-center cursor-pointer" onClick={() => handleSort('role')}>
            Role
            {sortField === 'role' && <ArrowUpDown className="h-3 w-3" />}
          </div>
          <div className="w-32 text-center cursor-pointer" onClick={() => handleSort('completionRate')}>
            Performance
            {sortField === 'completionRate' && <ArrowUpDown className="h-3 w-3" />}
          </div>
          <div className="w-24 text-center cursor-pointer" onClick={() => handleSort('totalTasks')}>
            Tasks
            {sortField === 'totalTasks' && <ArrowUpDown className="h-3 w-3" />}
          </div>
          <div className="w-28 text-center cursor-pointer" onClick={() => handleSort('joined_at')}>
            Joined
            {sortField === 'joined_at' && <ArrowUpDown className="h-3 w-3" />}
          </div>
          <div className="w-12"></div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm ? 'No members found' : 'No team members'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Add members to get started.'}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              {canManage && (
                <Checkbox
                  checked={selectedMembers.has(member.id)}
                  onCheckedChange={() => handleSelectMember(member.id)}
                />
              )}
              
              <div className="flex-1 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>
                    {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{member.name || 'Unknown User'}</h4>
                    {member.role === 'manager' && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="w-24 text-center">
                <Badge variant={member.role === 'manager' ? 'default' : 'secondary'}>
                  {member.role}
                </Badge>
              </div>
              
              <div className="w-32 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all" 
                      style={{ width: `${member.completionRate || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{member.completionRate || 0}%</span>
                </div>
              </div>
              
              <div className="w-24 text-center">
                <span className="text-sm font-medium">{member.totalTasks || 0}</span>
                {member.overdueTasks > 0 && (
                  <div className="flex items-center justify-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {member.overdueTasks}
                  </div>
                )}
              </div>
              
              <div className="w-28 text-center text-sm text-muted-foreground">
                {format(new Date(member.joined_at), 'MMM d, yyyy')}
              </div>
              
              <div className="w-12">
                {canManage && member.id !== user?.id && (
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
                      <DropdownMenuItem 
                        onClick={() => handleRoleChange(member.id, member.role === 'manager' ? 'member' : 'manager')}
                      >
                        {member.role === 'manager' ? 'Remove Manager Role' : 'Make Manager'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTransferMember(member)}>
                        Transfer to Another Team
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setMemberToRemove(member.id)}
                      >
                        Remove from Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialogs */}
      {canManage && (
        <>
          <AddUserToTeamDialog
            team={team}
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onMemberAdded={() => {
              refetch();
              setShowAddDialog(false);
            }}
          />

          <BulkTeamManagement
            open={showBulkDialog}
            onOpenChange={setShowBulkDialog}
            members={Array.from(selectedMembers).map(id => 
              filteredMembers.find(m => m.id === id)!
            ).filter(Boolean)}
            currentTeamId={team.id}
          />

          <TeamTransferDialog
            open={!!transferMember}
            onOpenChange={(open) => !open && setTransferMember(null)}
            member={transferMember}
            currentTeamId={team.id}
          />

          <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this member from the team? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove Member
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default TeamMembersTab;