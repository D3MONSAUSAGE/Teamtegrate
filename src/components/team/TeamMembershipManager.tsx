import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserPlus, UserMinus, Crown, User } from 'lucide-react';
import { useTeamContext } from '@/hooks/useTeamContext';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'member';
  avatar_url?: string;
  joined_at: string;
}

// Mock data - replace with actual team members data
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'manager',
    joined_at: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'member',
    joined_at: '2024-02-01',
  },
];

export const TeamMembershipManager: React.FC = () => {
  const teamContext = useTeamContext();
  const { user } = useAuth();

  // Ensure context is available
  if (!teamContext) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading team membership data...</p>
        </CardContent>
      </Card>
    );
  }

  const { selectedTeam, canManageTeam } = teamContext;

  if (!selectedTeam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a team to view members</p>
        </CardContent>
      </Card>
    );
  }

  const canManage = canManageTeam(selectedTeam.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mockTeamMembers.length} members in {selectedTeam.name}
          </p>
        </div>
        {canManage && (
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTeamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.name}</p>
                    <Badge variant={member.role === 'manager' ? 'default' : 'secondary'}>
                      {member.role === 'manager' ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Manager
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Member
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {canManage && member.id !== user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove from Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};