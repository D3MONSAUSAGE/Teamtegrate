import React, { useState, useEffect } from 'react';
import { User, Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, User as UserIcon, AlertTriangle, History, Eye } from 'lucide-react';
import AssignmentToggle from '../form/assignment/AssignmentToggle';
import TeamTaskAssignment from './TeamTaskAssignment';
import AssignmentPreview from './AssignmentPreview';
import AssignmentHistory from './AssignmentHistory';
import UserSearchDropdown from '../form/assignment/UserSearchDropdown';
import AssignedMemberCard from '../form/assignment/AssignedMemberCard';
import { EnhancedTaskAssignmentService, AssignmentOptions } from '@/services/EnhancedTaskAssignmentService';
import { toast } from '@/components/ui/sonner';

interface EnhancedUnifiedTaskAssignmentProps {
  task?: Task;
  selectedMember?: string;
  selectedMembers: string[];
  onAssign: (userId: string) => void;
  onMembersChange: (memberIds: string[]) => void;
  users: User[];
  isLoading: boolean;
  organizationId: string;
  showPreview?: boolean;
  showHistory?: boolean;
  onAssignmentComplete?: () => void;
}

const EnhancedUnifiedTaskAssignment: React.FC<EnhancedUnifiedTaskAssignmentProps> = ({
  task,
  selectedMember,
  selectedMembers,
  onAssign,
  onMembersChange,
  users,
  isLoading,
  organizationId,
  showPreview = true,
  showHistory = false,
  onAssignmentComplete
}) => {
  const { user: currentUser } = useAuth();
  const [assignmentType, setAssignmentType] = useState<'individual' | 'multiple' | 'team'>('individual');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [assignmentPreview, setAssignmentPreview] = useState<any>(null);

  // Initialize assignment type based on current task assignment
  useEffect(() => {
    if (task) {
      if (task.assignedToTeamId) {
        setAssignmentType('team');
        setSelectedTeamId(task.assignedToTeamId);
        setSelectedTeamName(task.assignedToTeamName || '');
      } else if (task.assignedToIds && task.assignedToIds.length > 1) {
        setAssignmentType('multiple');
      } else if (task.assignedToId) {
        setAssignmentType('individual');
      }
    }
  }, [task]);

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUsers = users.filter(user => selectedMembers.includes(user.id));

  const handleAssignmentTypeChange = (type: 'individual' | 'multiple' | 'team') => {
    setAssignmentType(type);
    
    // Clear conflicting selections
    if (type === 'team') {
      onMembersChange([]);
      onAssign('unassigned');
    } else {
      setSelectedTeamId('');
      setSelectedTeamName('');
    }
  };

  const handleUserSelect = (user: User) => {
    if (assignmentType === 'individual') {
      onAssign(user.id);
      onMembersChange([user.id]);
    } else if (assignmentType === 'multiple') {
      if (!selectedMembers.includes(user.id)) {
        const newMembers = [...selectedMembers, user.id];
        onMembersChange(newMembers);
      }
    }
    setSearchTerm('');
  };

  const handleUserRemove = (userId: string) => {
    const newMembers = selectedMembers.filter(id => id !== userId);
    onMembersChange(newMembers);
    
    if (assignmentType === 'individual' && newMembers.length === 0) {
      onAssign('unassigned');
    }
  };

  const handleTeamSelect = (teamId: string, teamName: string) => {
    setSelectedTeamId(teamId);
    setSelectedTeamName(teamName);
  };

  const generateAssignmentOptions = (): AssignmentOptions => {
    const userNames = selectedUsers.map(u => u.name || u.email);
    
    return {
      taskId: task?.id || '',
      assignmentType: assignmentType === 'team' ? 'team' : (selectedMembers.length > 1 ? 'multiple' : 'individual'),
      assignmentSource: 'manual',
      userIds: assignmentType === 'team' ? undefined : selectedMembers,
      userNames: assignmentType === 'team' ? undefined : userNames,
      teamId: assignmentType === 'team' ? selectedTeamId : undefined,
      teamName: assignmentType === 'team' ? selectedTeamName : undefined,
      organizationId,
      assignedBy: currentUser?.id || '',
      notes: `Manual assignment by ${currentUser?.name || currentUser?.email}`
    };
  };

  const handlePreview = async () => {
    if (!task) return;
    
    try {
      const options = generateAssignmentOptions();
      const preview = await EnhancedTaskAssignmentService.previewAssignment(options);
      setAssignmentPreview(preview);
      setShowPreviewDialog(true);
    } catch (error) {
      toast.error('Failed to generate assignment preview');
    }
  };

  const handleAssign = async () => {
    if (!task || !currentUser) return;

    // Validation
    if (assignmentType === 'team' && !selectedTeamId) {
      toast.error('Please select a team');
      return;
    }
    
    if (assignmentType !== 'team' && selectedMembers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setIsProcessing(true);
    try {
      const options = generateAssignmentOptions();
      const success = await EnhancedTaskAssignmentService.assignTask(options);
      
      if (success && onAssignmentComplete) {
        onAssignmentComplete();
      }
    } catch (error) {
      toast.error('Failed to assign task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnassign = async () => {
    if (!task || !currentUser) return;

    setIsProcessing(true);
    try {
      const success = await EnhancedTaskAssignmentService.unassignTask(
        task.id,
        organizationId,
        currentUser.id
      );
      
      if (success) {
        onMembersChange([]);
        onAssign('unassigned');
        setSelectedTeamId('');
        setSelectedTeamName('');
        
        if (onAssignmentComplete) {
          onAssignmentComplete();
        }
      }
    } catch (error) {
      toast.error('Failed to unassign task');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrentAssignmentSummary = () => {
    if (task?.assignedToTeamName) {
      return `Currently assigned to team: ${task.assignedToTeamName}`;
    }
    
    if (task?.assignedToNames && task.assignedToNames.length > 0) {
      return `Currently assigned to: ${task.assignedToNames.join(', ')}`;
    }
    
    return 'Currently unassigned';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Task Assignment
          </CardTitle>
          <div className="flex gap-2">
            {showPreview && task && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            )}
            {showHistory && task && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryDialog(true)}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            )}
          </div>
        </div>
        {task && (
          <div className="text-sm text-muted-foreground">
            {getCurrentAssignmentSummary()}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Assignment Type Selection */}
        <Tabs value={assignmentType} onValueChange={(value: any) => handleAssignmentTypeChange(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="multiple" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Multiple
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4">
            <UserSearchDropdown
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredUsers={filteredUsers}
              onSelectUser={handleUserSelect}
            />
            
            {selectedUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Selected User:</h4>
                <AssignedMemberCard
                  user={selectedUsers[0]}
                  onRemove={handleUserRemove}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="multiple" className="space-y-4">
            <UserSearchDropdown
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredUsers={filteredUsers}
              onSelectUser={handleUserSelect}
            />
            
            {selectedUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Selected Users ({selectedUsers.length}):</h4>
                <div className="space-y-2">
                  {selectedUsers.map(user => (
                    <AssignedMemberCard
                      key={user.id}
                      user={user}
                      onRemove={handleUserRemove}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamTaskAssignment
              selectedTeamId={selectedTeamId}
              selectedTeamName={selectedTeamName}
              onTeamSelect={handleTeamSelect}
              organizationId={organizationId}
            />
          </TabsContent>
        </Tabs>

        {/* Assignment Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleAssign}
            disabled={isProcessing || isLoading || 
              (assignmentType === 'team' && !selectedTeamId) ||
              (assignmentType !== 'team' && selectedMembers.length === 0)
            }
            className="flex items-center gap-2"
          >
            {isProcessing ? 'Assigning...' : 'Assign Task'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleUnassign}
            disabled={isProcessing || isLoading}
          >
            Unassign
          </Button>
        </div>
      </CardContent>

      {/* Assignment Preview Dialog */}
      {showPreviewDialog && assignmentPreview && (
        <AssignmentPreview
          preview={assignmentPreview}
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          onConfirm={handleAssign}
        />
      )}

      {/* Assignment History Dialog */}
      {showHistoryDialog && task && (
        <AssignmentHistory
          taskId={task.id}
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
        />
      )}
    </Card>
  );
};

export default EnhancedUnifiedTaskAssignment;