import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Users, 
  ArrowLeft, 
  ArrowRight, 
  Crown, 
  Shield, 
  User as UserIcon,
  Check,
  Search,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useUsers } from '@/hooks/useUsers';
import { Team } from '@/types/teams';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface EditTeamDialogProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'manager' | 'member';
  system_role_override?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
}

interface TeamMemberSelection {
  user: User;
  role: 'manager' | 'member';
  isTeamLeader: boolean;
  isExisting: boolean;
  isRemoved?: boolean;
}

const EditTeamDialog: React.FC<EditTeamDialogProps> = ({
  team,
  open,
  onOpenChange,
}) => {
  const { updateTeam, isUpdating, addTeamMember, removeTeamMember, updateTeamMemberRole, refetchTeams } = useTeamManagement();
  const { users, isLoading: usersLoading } = useUsers();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
    manager_id: team.manager_id || '',
  });
  
  const [existingMembers, setExistingMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<TeamMemberSelection[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Load existing team members
  useEffect(() => {
    if (open && team.id) {
      loadTeamMembers();
    }
  }, [open, team.id]);

  // Reset form when team changes
  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        manager_id: team.manager_id || '',
      });
      setCurrentStep(1);
      setSelectedMembers([]);
      setMemberSearch('');
    }
  }, [team]);

  const loadTeamMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          id,
          user_id,
          role,
          system_role_override,
          users!inner (
            id,
            name,
            email,
            avatar_url,
            role
          )
        `)
        .eq('team_id', team.id);

      if (error) throw error;

      const members = data?.map(member => ({
        ...member,
        role: member.role as 'manager' | 'member',
        user: member.users as any
      })) || [];

      setExistingMembers(members);
      
      // Convert to selection format
      const memberSelections = members.map(member => ({
        user: member.user,
        role: member.role as 'manager' | 'member',
        isTeamLeader: member.system_role_override === 'team_leader',
        isExisting: true,
      }));
      
      setSelectedMembers(memberSelections);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Allow any organization user to be a manager (not just admin/manager roles)
  const potentialManagers = users;

  // Filter available users for member selection (excluding selected manager and existing members)
  const availableUsers = users.filter(user => {
    const isNotManager = user.id !== formData.manager_id;
    const matchesSearch = memberSearch === '' || 
      user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(memberSearch.toLowerCase());
    const notAlreadySelected = !selectedMembers.some(member => 
      member.user.id === user.id && !member.isRemoved
    );
    return isNotManager && matchesSearch && notAlreadySelected;
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMemberToggle = (user: User) => {
    const existingMember = selectedMembers.find(member => member.user.id === user.id);
    
    if (existingMember) {
      if (existingMember.isExisting) {
        // Mark existing member for removal
        setSelectedMembers(selectedMembers.map(member =>
          member.user.id === user.id ? { ...member, isRemoved: !member.isRemoved } : member
        ));
      } else {
        // Remove new member completely
        setSelectedMembers(selectedMembers.filter(member => member.user.id !== user.id));
      }
    } else {
      // Add new member
      setSelectedMembers([...selectedMembers, {
        user,
        role: 'member',
        isTeamLeader: false,
        isExisting: false
      }]);
    }
  };

  const handleRoleChange = (userId: string, role: 'manager' | 'member') => {
    setSelectedMembers(selectedMembers.map(member =>
      member.user.id === userId ? { ...member, role } : member
    ));
    
    // Auto-sync manager_id when someone is set as manager
    if (role === 'manager') {
      console.log('EditTeamDialog: Auto-syncing manager_id to:', userId);
      setFormData(prev => ({ ...prev, manager_id: userId }));
    }
  };

  const handleTeamLeaderToggle = (userId: string) => {
    setSelectedMembers(selectedMembers.map(member =>
      member.user.id === userId ? { ...member, isTeamLeader: !member.isTeamLeader } : member
    ));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      console.log('EditTeamDialog: Submitting team update with:', {
        teamId: team.id,
        name: formData.name,
        description: formData.description,
        manager_id: formData.manager_id === 'none' ? null : formData.manager_id || null,
      });

      // Update basic team info - explicitly handle manager_id
      const updateData = {
        name: formData.name,
        description: formData.description,
        manager_id: formData.manager_id === 'none' ? null : formData.manager_id || null,
      };

      await updateTeam(team.id, updateData);

      // Process member changes
      const memberPromises: Promise<any>[] = [];

      selectedMembers.forEach((memberSelection) => {
        if (memberSelection.isExisting && memberSelection.isRemoved) {
          // Remove existing member
          memberPromises.push(removeTeamMember(team.id, memberSelection.user.id));
        } else if (memberSelection.isExisting && !memberSelection.isRemoved) {
          // Update existing member if role or team leader status changed
          const originalMember = existingMembers.find(m => m.user_id === memberSelection.user.id);
          const roleChanged = originalMember?.role !== memberSelection.role;
          const leaderChanged = (originalMember?.system_role_override === 'team_leader') !== memberSelection.isTeamLeader;
          
          if (roleChanged || leaderChanged) {
            // Update both role and system_role_override directly
            memberPromises.push(
              (async () => {
                const { error } = await supabase
                  .from('team_memberships')
                  .update({
                    role: memberSelection.role,
                    system_role_override: memberSelection.isTeamLeader ? 'team_leader' : null
                  })
                  .eq('team_id', team.id)
                  .eq('user_id', memberSelection.user.id);
                
                if (error) throw error;
              })()
            );
          }
        } else if (!memberSelection.isExisting && !memberSelection.isRemoved) {
          // Add new member
          memberPromises.push(
            addTeamMember(
              team.id, 
              memberSelection.user.id, 
              memberSelection.role,
              memberSelection.isTeamLeader ? 'team_leader' : undefined
            )
          );
        }
      });

      await Promise.all(memberPromises);
      
      // Refresh teams data
      refetchTeams();
      
      toast.success('Team updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('EditTeamDialog - submission error:', error);
      toast.error('Failed to update team');
    }
  };

  const handleClose = () => {
    setFormData({
      name: team.name,
      description: team.description || '',
      manager_id: team.manager_id || '',
    });
    setSelectedMembers([]);
    setCurrentStep(1);
    setMemberSearch('');
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() !== '';
      case 2: return true; // Manager is optional
      case 3: return true; // Member changes are optional
      case 4: return true; // Summary/confirmation
      default: return false;
    }
  };

  const getRoleIcon = (role: string, isTeamLeader?: boolean) => {
    if (isTeamLeader) return <Shield className="h-4 w-4 text-blue-600" />;
    if (role === 'manager') return <Crown className="h-4 w-4 text-yellow-600" />;
    return <UserIcon className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangesSummary = () => {
    const changes: string[] = [];
    
    // Basic info changes
    if (formData.name !== team.name) {
      changes.push(`Name: "${team.name}" → "${formData.name}"`);
    }
    if (formData.description !== (team.description || '')) {
      changes.push(`Description updated`);
    }
    
    // Manager changes
    if (formData.manager_id !== (team.manager_id || '')) {
      changes.push(`Manager changed`);
    }

    // Member changes
    const removedMembers = selectedMembers.filter(m => m.isExisting && m.isRemoved).length;
    const newMembers = selectedMembers.filter(m => !m.isExisting && !m.isRemoved).length;
    const modifiedMembers = selectedMembers.filter(m => {
      if (!m.isExisting || m.isRemoved) return false;
      const original = existingMembers.find(em => em.user_id === m.user.id);
      return original && (
        original.role !== m.role || 
        (original.system_role_override === 'team_leader') !== m.isTeamLeader
      );
    }).length;

    if (removedMembers > 0) changes.push(`${removedMembers} member(s) removed`);
    if (newMembers > 0) changes.push(`${newMembers} member(s) added`);
    if (modifiedMembers > 0) changes.push(`${modifiedMembers} member role(s) updated`);

    return changes;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter team description (optional)"
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Team Manager</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Update the team manager (optional)
              </p>
            </div>
            
            <Select
              value={formData.manager_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, manager_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No manager assigned</SelectItem>
                {potentialManagers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {user.name} ({user.role})
                      {user.id === team.manager_id && <Badge variant="outline" className="text-xs">Current</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Manage Team Members</Label>
              <p className="text-sm text-muted-foreground">
                Add, remove, or modify team member roles
              </p>
            </div>

            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading team members...</span>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users to add..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Current Members */}
                {selectedMembers.filter(m => !m.isRemoved).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Team Members ({selectedMembers.filter(m => !m.isRemoved).length})
                    </Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedMembers.filter(m => !m.isRemoved).map((memberSelection) => (
                        <Card key={memberSelection.user.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={memberSelection.user.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {memberSelection.user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{memberSelection.user.name}</p>
                                <p className="text-xs text-muted-foreground">{memberSelection.user.email}</p>
                              </div>
                              {memberSelection.isExisting && (
                                <Badge variant="outline" className="text-xs">Existing</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Checkbox
                                  id={`leader-${memberSelection.user.id}`}
                                  checked={memberSelection.isTeamLeader}
                                  onCheckedChange={() => handleTeamLeaderToggle(memberSelection.user.id)}
                                />
                                <Label htmlFor={`leader-${memberSelection.user.id}`} className="text-xs">
                                  Team Leader
                                </Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMemberToggle(memberSelection.user)}
                              >
                                {memberSelection.isExisting ? <Trash2 className="h-4 w-4" /> : 'Remove'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members to be removed */}
                {selectedMembers.filter(m => m.isRemoved).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-destructive">
                      Members to be removed ({selectedMembers.filter(m => m.isRemoved).length})
                    </Label>
                    <div className="space-y-2">
                      {selectedMembers.filter(m => m.isRemoved).map((memberSelection) => (
                        <Card key={`removed-${memberSelection.user.id}`} className="p-3 bg-destructive/10 border-destructive/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={memberSelection.user.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {memberSelection.user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium line-through">{memberSelection.user.name}</p>
                                <p className="text-xs text-muted-foreground">{memberSelection.user.email}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMemberToggle(memberSelection.user)}
                            >
                              Undo
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Users to Add */}
                {availableUsers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Available Users to Add</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {availableUsers.map((user) => (
                        <Card 
                          key={user.id} 
                          className="p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => handleMemberToggle(user)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 4:
        const changes = getChangesSummary();
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Review Changes</Label>
              <p className="text-sm text-muted-foreground">
                Review the changes before applying them to the team
              </p>
            </div>

            <Card className="p-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Team Name</Label>
                  <p className="text-sm">{formData.name}</p>
                </div>
                
                {formData.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm">{formData.description}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Manager</Label>
                  <p className="text-sm">
                    {formData.manager_id && formData.manager_id !== 'none' 
                      ? potentialManagers.find(u => u.id === formData.manager_id)?.name || 'Unknown'
                      : 'No manager assigned'
                    }
                  </p>
                </div>

                <Separator />

                {changes.length > 0 ? (
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Changes to Apply ({changes.length})
                    </Label>
                    <div className="space-y-1 mt-2">
                      {changes.map((change, index) => (
                        <p key={index} className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                          {change}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm font-medium">No Changes</Label>
                    <p className="text-sm text-muted-foreground">No changes detected</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Edit Team: {team.name}
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Step Content */}
        <div className="py-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handlePrevious}
            disabled={isUpdating}
          >
            {currentStep === 1 ? 'Cancel' : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </>
            )}
          </Button>
          
          {currentStep === totalSteps ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isUpdating || !canProceed()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating Team...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Update Team
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTeamDialog;