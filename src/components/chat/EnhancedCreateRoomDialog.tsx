import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Users, Crown, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChatRoomPermissions } from './hooks/useChatRoomPermissions';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedCreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (name: string, description?: string, isPublic?: boolean, teamId?: string) => Promise<any>;
  preselectedTeamId?: string;
}

const EnhancedCreateRoomDialog: React.FC<EnhancedCreateRoomDialogProps> = ({
  open,
  onOpenChange,
  onCreateRoom,
  preselectedTeamId
}) => {
  const { user } = useAuth();
  const { canCreateChatRoom, userTeams, userRole } = useChatRoomPermissions();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(preselectedTeamId || 'none');
  const [loading, setLoading] = useState(false);

  const canCreate = canCreateChatRoom();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !canCreate) return;

    try {
      setLoading(true);
      await onCreateRoom(
        name.trim(), 
        description.trim() || undefined, 
        isPublic,
        (selectedTeamId && selectedTeamId !== 'none') ? selectedTeamId : undefined
      );
      
      // Reset form
      setName('');
      setDescription('');
      setIsPublic(false);
      setSelectedTeamId('none');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'manager':
        return <Shield className="h-3 w-3 text-blue-600" />;
      case 'team_leader':
        return <Users className="h-3 w-3 text-green-600" />;
      default:
        return null;
    }
  };

  if (!canCreate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Chat Room</DialogTitle>
          </DialogHeader>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to create chat rooms. Only team leaders, managers, and administrators can create new chat rooms.
            </AlertDescription>
          </Alert>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Chat Room
            <Badge variant="outline" className="ml-2">
              {getRoleIcon(userRole || '')}
              {userRole?.replace('_', ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Room Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name..."
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional room description..."
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Team Selection - Only show for team-based roles */}
          {(['manager', 'team_leader'].includes(userRole || '') && userTeams.length > 0) && (
            <div>
              <Label htmlFor="team">Associate with Team (Optional)</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team association</SelectItem>
                  {userTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTeamId && selectedTeamId !== 'none' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Team members will be automatically invited to this room
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              disabled={loading}
            />
            <Label htmlFor="public" className="text-sm">
              Make this room public
            </Label>
          </div>

          {isPublic && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Public rooms can be joined by anyone in your organization without an invitation.
              </AlertDescription>
            </Alert>
          )}

          {/* Role-specific guidance */}
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">
              <strong>As a {userRole?.replace('_', ' ')}:</strong>
              {userRole === 'team_leader' && ' You can create chats and invite your team members.'}
              {userRole === 'manager' && ' You can create chats and invite your team members, other managers, and administrators.'}
              {(['admin', 'superadmin'].includes(userRole || '')) && ' You can create chats and invite anyone in your organization.'}
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCreateRoomDialog;