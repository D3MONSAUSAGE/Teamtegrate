
import React, { useState } from 'react';
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
  Search
} from 'lucide-react';
import { useTeamManagement } from '@/hooks/organization/useTeamManagement';
import { useUsers } from '@/hooks/useUsers';
import { CreateTeamData } from '@/types/teams';
import { User } from '@/types';
import { CheckedState } from "@radix-ui/react-checkbox";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeamMemberSelection {
  user: User;
  role: 'manager' | 'member' | 'admin';
}

const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { createTeam, isCreating, addTeamMember } = useTeamManagement();
  const { users, isLoading: usersLoading, error: usersError } = useUsers();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateTeamData>({
    name: '',
    description: '',
  });
  const [selectedMembers, setSelectedMembers] = useState<TeamMemberSelection[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [includeAdmins, setIncludeAdmins] = useState(false);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Filter available users for member selection
  const availableUsers = users.filter(user => {
    const matchesSearch = memberSearch === '' || 
      user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(memberSearch.toLowerCase());
    const notAlreadySelected = !selectedMembers.some(member => member.user.id === user.id);
    return matchesSearch && notAlreadySelected;
  });

  // Organization admins for optional inclusion
  const orgAdmins = users.filter(user => 
    ['admin', 'superadmin'].includes(user.role) && 
    !selectedMembers.some(member => member.user.id === user.id)
  );

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
    const isSelected = selectedMembers.some(member => member.user.id === user.id);
    
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter(member => member.user.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, {
        user,
        role: 'member'
      }]);
    }
  };

  const handleRoleChange = (userId: string, role: 'manager' | 'member' | 'admin') => {
    setSelectedMembers(selectedMembers.map(member =>
      member.user.id === userId ? { ...member, role } : member
    ));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      // Create the team first
      const team = await createTeam({
        ...formData,
      });

      if (team) {
        // Add selected members to the team
        const memberPromises = selectedMembers.map(async (memberSelection) => {
          await addTeamMember(
            team.id, 
            memberSelection.user.id, 
            memberSelection.role
          );
        });

        // Add admins if requested
        if (includeAdmins) {
          const adminPromises = orgAdmins.map(async (admin) => {
            await addTeamMember(team.id, admin.id, 'member');
          });
          memberPromises.push(...adminPromises);
        }

        await Promise.all(memberPromises);
      }
      
      // Reset form
      setFormData({ name: '', description: '' });
      setSelectedMembers([]);
      setCurrentStep(1);
      setMemberSearch('');
      setIncludeAdmins(false);
      onOpenChange(false);
    } catch (error) {
      console.error('CreateTeamDialog - submission error:', error);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    setSelectedMembers([]);
    setCurrentStep(1);
    setMemberSearch('');
    setIncludeAdmins(false);
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() !== '';
      case 2: return true; // Members are optional
      case 3: return true; // Summary/confirmation
      default: return false;
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'manager') return <Crown className="h-4 w-4 text-yellow-600" />;
    if (role === 'admin') return <Shield className="h-4 w-4 text-blue-600" />;
    return <UserIcon className="h-4 w-4 text-muted-foreground" />;
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
              <Label className="text-base font-medium">Team Members</Label>
              <p className="text-sm text-muted-foreground">
                Select team members and assign roles
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Members ({selectedMembers.length})</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedMembers.map((memberSelection) => (
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
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={memberSelection.role}
                            onValueChange={(role) => handleRoleChange(memberSelection.user.id, role as 'manager' | 'member' | 'admin')}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMemberToggle(memberSelection.user)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Users */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Available Users</Label>
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

            {/* Include Admins Option */}
            {orgAdmins.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-admins"
                    checked={includeAdmins}
                    onCheckedChange={(checked) => setIncludeAdmins(checked === true)}
                  />
                  <Label htmlFor="include-admins" className="text-sm">
                    Include organization admins ({orgAdmins.length})
                  </Label>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Team Summary</Label>
              <p className="text-sm text-muted-foreground">
                Review your team configuration before creating
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
                  <Label className="text-sm font-medium">Members ({selectedMembers.length + (includeAdmins ? orgAdmins.length : 0)})</Label>
                  <div className="space-y-1 mt-2">
                    {selectedMembers.map((memberSelection) => (
                      <div key={memberSelection.user.id} className="flex items-center gap-2 text-sm">
                        {getRoleIcon(memberSelection.role)}
                        <span>{memberSelection.user.name}</span>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {memberSelection.role}
                        </Badge>
                      </div>
                    ))}
                    {includeAdmins && orgAdmins.map((admin) => (
                      <div key={admin.id} className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{admin.name}</span>
                        <Badge variant="outline" className="text-xs">Admin</Badge>
                      </div>
                    ))}
                  </div>
                </div>
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
            Create New Team
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
            disabled={isCreating}
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
              disabled={isCreating || !canProceed()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Team...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Team
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

export default CreateTeamDialog;
