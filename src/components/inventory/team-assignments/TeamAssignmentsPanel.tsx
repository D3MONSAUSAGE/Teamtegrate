import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoiceTeams } from '@/hooks/useInvoiceTeams';
import { TeamAssignmentDialog } from './TeamAssignmentDialog';
import { TeamAssignmentCard } from './TeamAssignmentCard';
import { AssignmentScheduler } from './AssignmentScheduler';
import { 
  Users, 
  Plus, 
  Search, 
  Calendar,
  FileText,
  Filter,
  Clock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const TeamAssignmentsPanel: React.FC = () => {
  const { templates, teamAssignments, assignTemplateToTeam } = useInventory();
  const { hasRoleAccess } = useAuth();
  const { teams } = useInvoiceTeams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Filter and group assignments
  const filteredAssignments = useMemo(() => {
    return teamAssignments.filter(assignment => {
      const template = templates.find(t => t.id === assignment.template_id);
      const team = teams.find(t => t.id === assignment.team_id);
      
      const matchesSearch = !searchTerm || 
        template?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTeam = selectedTeamFilter === 'all' || assignment.team_id === selectedTeamFilter;
      const matchesStatus = selectedStatusFilter === 'all' || (assignment.is_active ? 'active' : 'completed') === selectedStatusFilter;
      
      return matchesSearch && matchesTeam && matchesStatus;
    });
  }, [teamAssignments, templates, teams, searchTerm, selectedTeamFilter, selectedStatusFilter]);

  // Group assignments by status
  const assignmentsByStatus = useMemo(() => {
    return {
      active: filteredAssignments.filter(a => a.is_active),
      pending: filteredAssignments.filter(a => false), // No pending status yet
      completed: filteredAssignments.filter(a => !a.is_active),
    };
  }, [filteredAssignments]);

  const handleAssignTemplate = async (templateId: string, teamIds: string[]) => {
    try {
      for (const teamId of teamIds) {
        await assignTemplateToTeam(templateId, teamId);
      }
      setShowAssignmentDialog(false);
    } catch (error) {
      console.error('Error assigning template:', error);
    }
  };

  const canManageAssignments = hasRoleAccess('manager');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Assignments
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage inventory template assignments across teams
          </p>
        </div>
        
        {canManageAssignments && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowScheduler(true)}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedule
            </Button>
            <Button
              onClick={() => setShowAssignmentDialog(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Assign Template
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search assignments by template or team name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active ({assignmentsByStatus.active.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Pending ({assignmentsByStatus.pending.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Completed ({assignmentsByStatus.completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <AssignmentsGrid 
            assignments={assignmentsByStatus.active}
            templates={templates}
            teams={teams}
            status="active"
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <AssignmentsGrid 
            assignments={assignmentsByStatus.pending}
            templates={templates}
            teams={teams}
            status="pending"
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <AssignmentsGrid 
            assignments={assignmentsByStatus.completed}
            templates={templates}
            teams={teams}
            status="completed"
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TeamAssignmentDialog
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
        templates={templates}
        teams={teams}
      onAssign={handleAssignTemplate}
      />

      <AssignmentScheduler
        open={showScheduler}
        onOpenChange={setShowScheduler}
        templates={templates}
        teams={teams}
      />
    </div>
  );
};

interface AssignmentsGridProps {
  assignments: any[];
  templates: any[];
  teams: any[];
  status: string;
}

const AssignmentsGrid: React.FC<AssignmentsGridProps> = ({
  assignments,
  templates,
  teams,
  status
}) => {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No {status} assignments</h3>
            <p className="text-sm">
              {status === 'active' 
                ? 'No active assignments found. Create new assignments to get started.'
                : `No ${status} assignments found.`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assignments.map((assignment) => (
        <TeamAssignmentCard
          key={assignment.id}
          assignment={assignment}
          template={templates.find(t => t.id === assignment.template_id)}
          team={teams.find(t => t.id === assignment.team_id)}
        />
      ))}
    </div>
  );
};