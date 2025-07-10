import React, { useState, useMemo, useEffect } from 'react';
import { User } from '@/types';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, X, Plus, UserCheck, Building2, UserCircle, Shield, Crown } from 'lucide-react';
import { useUnifiedTaskAssignment } from '@/hooks/useUnifiedTaskAssignment';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useTeamsByOrganization } from '@/hooks/useTeamsByOrganization';
import { useUsersByContext } from '@/hooks/useUsersByContext';
import { useTaskAssignmentValidation } from '@/hooks/useTaskAssignmentValidation';
import OrganizationSelector from '@/components/organization/OrganizationSelector';
import TeamSelect from '@/components/ui/team-select';

interface UnifiedTaskAssignmentProps {
  taskId?: string;
  selectedUsers?: User[];
  selectedUser?: string;
  selectedMember?: string;
  selectedMembers?: string[];
  onSelectionChange?: (users: User[]) => void;
  onAssign?: (userId: string) => void;
  onMembersChange?: (memberIds: string[]) => void;
  availableUsers?: User[];
  users?: User[];
  isLoading?: boolean;
  disabled?: boolean;
  multiAssignMode?: boolean;
  editingTask?: any;
  showOrganizationSelect?: boolean;
  showTeamSelect?: boolean;
}

const UnifiedTaskAssignment: React.FC<UnifiedTaskAssignmentProps> = ({
  taskId,
  selectedUsers = [],
  selectedUser = "unassigned",
  selectedMember,
  selectedMembers = [],
  onSelectionChange,
  onAssign,
  onMembersChange,
  availableUsers = [],
  users: fallbackUsers = [],
  isLoading: fallbackLoading = false,
  disabled = false,
  multiAssignMode = false,
  editingTask,
  showOrganizationSelect,
  showTeamSelect
}) => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [internalMultiMode, setInternalMultiMode] = useState(multiAssignMode);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  const { assignTask, unassignTask, isAssigning } = useUnifiedTaskAssignment();
  
  // Data hooks for organization/team selection
  const { organizations = [], isLoading: loadingOrgs } = useOrganizations();
  const { teams = [], isLoading: loadingTeams } = useTeamsByOrganization(selectedOrganization);
  const { users: contextUsers = [], isLoading: loadingUsers } = useUsersByContext(
    selectedOrganization, 
    selectedTeam === 'all' ? undefined : selectedTeam
  );

  // Assignment validation
  const { 
    filterAssignableUsers, 
    getAssignmentPermissions,
    validateUserAssignment
  } = useTaskAssignmentValidation();

  // Determine final user lists and loading states
  const shouldShowOrgSelect = showOrganizationSelect ?? (currentUser?.role === 'superadmin');
  const shouldShowTeamSelect = showTeamSelect ?? (currentUser?.role === 'superadmin' || currentUser?.role === 'admin');
  
  const finalUsers = Array.isArray(availableUsers.length > 0 ? availableUsers : 
    (currentUser?.role === 'manager' ? fallbackUsers : contextUsers)) 
    ? (availableUsers.length > 0 ? availableUsers : 
       (currentUser?.role === 'manager' ? fallbackUsers : contextUsers))
    : [];
  
  const finalLoading = availableUsers.length > 0 ? false : 
    (currentUser?.role === 'manager' ? fallbackLoading : loadingUsers);

  const assignableUsers = filterAssignableUsers(finalUsers);
  const permissions = getAssignmentPermissions();

  // Initialize organization selection
  useEffect(() => {
    if (currentUser?.role === 'superadmin' && !selectedOrganization && currentUser.organizationId) {
      setSelectedOrganization(currentUser.organizationId);
    }
  }, [currentUser, selectedOrganization]);

  // Determine current selection based on mode
  const currentSelection = useMemo(() => {
    if (internalMultiMode) {
      const memberIds = selectedMembers.length > 0 ? selectedMembers : 
        selectedUsers.map(u => u.id);
      return finalUsers.filter(user => memberIds.includes(user.id));
    } else {
      const singleId = selectedMember || selectedUser;
      if (singleId && singleId !== "unassigned") {
        const user = finalUsers.find(u => u.id === singleId);
        return user ? [user] : [];
      }
      return selectedUsers.length === 1 ? selectedUsers : [];
    }
  }, [internalMultiMode, selectedMembers, selectedUsers, selectedMember, selectedUser, finalUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return assignableUsers;
    
    const query = searchQuery.toLowerCase();
    return assignableUsers.filter(user => {
      const name = user.name || user.email;
      return name.toLowerCase().includes(query) || 
             user.email.toLowerCase().includes(query);
    });
  }, [assignableUsers, searchQuery]);

  const availableFilteredUsers = filteredUsers.filter(
    user => !currentSelection.some(selected => selected.id === user.id)
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin': return <Shield className="h-3 w-3 text-blue-500" />;
      case 'manager': return <Users className="h-3 w-3 text-green-500" />;
      default: return <UserCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  const handleAddUser = (user: User) => {
    const newSelection = [...currentSelection, user];
    updateSelection(newSelection);
  };

  const handleRemoveUser = (userId: string) => {
    const newSelection = currentSelection.filter(user => user.id !== userId);
    updateSelection(newSelection);
  };

  const handleSingleAssign = (userId: string) => {
    if (!validateUserAssignment(userId, finalUsers)) return;
    
    if (userId === "unassigned") {
      updateSelection([]);
    } else {
      const user = finalUsers.find(u => u.id === userId);
      if (user) {
        updateSelection([user]);
      }
    }
  };

  const updateSelection = (newUsers: User[]) => {
    // Update all possible callbacks
    onSelectionChange?.(newUsers);
    
    if (internalMultiMode) {
      onMembersChange?.(newUsers.map(u => u.id));
    } else {
      onAssign?.(newUsers.length > 0 ? newUsers[0].id : "unassigned");
    }
  };

  const handleModeToggle = (enabled: boolean) => {
    setInternalMultiMode(enabled);
    
    if (enabled) {
      // Switch to multi-mode: keep current single selection
      if (currentSelection.length === 1) {
        onMembersChange?.([currentSelection[0].id]);
      }
    } else {
      // Switch to single mode: take first from multi-selection
      if (currentSelection.length > 0) {
        onAssign?.(currentSelection[0].id);
      } else {
        onAssign?.("unassigned");
      }
    }
  };

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganization(orgId);
    setSelectedTeam('');
    updateSelection([]);
  };

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
    updateSelection([]);
  };

  const handleApplyAssignment = async () => {
    if (!taskId) return;
    
    if (currentSelection.length === 0) {
      await unassignTask(taskId);
    } else {
      await assignTask(taskId, currentSelection);
    }
  };

  if (finalLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Task Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading team members...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-100 h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Task Assignment
          {finalUsers.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({finalUsers.length} available)
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Assign this task to team members. You can select multiple people for collaborative tasks.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Organization Selection */}
        {shouldShowOrgSelect && (
          <OrganizationSelector
            organizations={organizations}
            isLoading={loadingOrgs}
            selectedOrganization={selectedOrganization}
            onOrganizationChange={handleOrganizationChange}
            label="Select Organization"
            placeholder="Choose organization for task assignment"
          />
        )}

        {/* Team Selection */}
        {shouldShowTeamSelect && (
          <TeamSelect
            teams={teams}
            isLoading={loadingTeams}
            selectedTeam={selectedTeam}
            onTeamChange={handleTeamChange}
            disabled={shouldShowOrgSelect && !selectedOrganization}
            optional={currentUser?.role === 'superadmin'}
          />
        )}

        {/* Multi-assign toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Multiple Assignment</Label>
          <Switch
            checked={internalMultiMode}
            onCheckedChange={handleModeToggle}
            disabled={disabled}
          />
        </div>

        {/* Single Assignment Mode */}
        {!internalMultiMode && (
          <div className="space-y-2">
            <Label>Assignee</Label>
            {!permissions.canAssign && (
              <div className="text-sm text-destructive">
                You don't have permission to assign tasks
              </div>
            )}
            <Select 
              value={currentSelection.length > 0 ? currentSelection[0].id : "unassigned"} 
              onValueChange={handleSingleAssign} 
              disabled={finalLoading || !permissions.canAssign || disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-gray-400" />
                    Unassigned
                  </div>
                </SelectItem>
                {assignableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span>{user.name || user.email}</span>
                      </div>
                      <Badge variant="outline" className="text-xs ml-2">
                        {user.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Multi Assignment Mode */}
        {internalMultiMode && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={disabled}
              />
            </div>

            {/* Currently Selected */}
            {currentSelection.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Assigned Members ({currentSelection.length})
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateSelection([])}
                    disabled={disabled || isAssigning}
                    className="h-7 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {currentSelection.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-primary/5"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(user.name || user.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium">{user.name || user.email}</span>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                        disabled={disabled || isAssigning}
                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Members */}
            {availableFilteredUsers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Members</Label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {availableFilteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(user.name || user.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm">{user.name || user.email}</span>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddUser(user)}
                        disabled={disabled || isAssigning}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* No results */}
        {availableFilteredUsers.length === 0 && searchQuery && internalMultiMode && (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No members found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Empty state */}
        {currentSelection.length === 0 && availableFilteredUsers.length === 0 && !searchQuery && internalMultiMode && (
          <div className="text-center py-4 text-muted-foreground">
            <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All available members are already assigned</p>
          </div>
        )}

        {/* No Users Available Warning */}
        {!finalLoading && finalUsers.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <UserCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No users available for assignment</p>
            {shouldShowOrgSelect && !selectedOrganization && (
              <p className="text-xs mt-1">Select an organization to see available users</p>
            )}
          </div>
        )}

        {/* Context Info */}
        {(selectedOrganization || selectedTeam) && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
            {selectedOrganization && (
              <div>Organization: {organizations.find(o => o.id === selectedOrganization)?.name || 'Unknown'}</div>
            )}
            {selectedTeam && selectedTeam !== 'all' && (
              <div>Team: {teams.find(t => t.id === selectedTeam)?.name || 'Unknown'}</div>
            )}
            {selectedTeam === 'all' && (
              <div>Team: All Teams</div>
            )}
            <div>Available assignees: {finalUsers.length}</div>
          </div>
        )}

        {/* Apply Assignment Button (only show if taskId is provided) */}
        {taskId && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleApplyAssignment}
              disabled={disabled || isAssigning}
              className="w-full"
              variant={currentSelection.length === 0 ? "outline" : "default"}
            >
              {isAssigning ? (
                <>Applying...</>
              ) : currentSelection.length === 0 ? (
                <>Unassign Task</>
              ) : (
                <>Assign to {currentSelection.length} Member{currentSelection.length !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        )}

        {/* Permission warnings */}
        {permissions.canOnlyAssignSelf && (
          <div className="text-xs text-muted-foreground">
            You can only assign tasks to yourself
          </div>
        )}
        
        {assignableUsers.length === 0 && finalUsers.length > 0 && (
          <div className="text-xs text-destructive">
            No users available for assignment in your organization
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedTaskAssignment;
