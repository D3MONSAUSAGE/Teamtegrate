import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TeamSelect } from '@/components/ui/team-select';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { useTeams } from '@/hooks/useTeams';
import { InventoryTemplate } from '@/contexts/inventory/types';
import { Search, Package, Users, Play, Shield } from 'lucide-react';

interface TemplateCountSelectionDialogProps {
  children: React.ReactNode;
  onStartCount: (template: InventoryTemplate, selectedTeam?: { id: string; name: string }) => void;
}

export const TemplateCountSelectionDialog: React.FC<TemplateCountSelectionDialogProps> = ({
  children,
  onStartCount,
}) => {
  const { user } = useAuth();
  const { teams, isLoading: teamsLoading } = useTeams();
  const { templates, teamAssignments } = useInventory();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const isAdmin = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'superadmin';
  
  // Filter templates based on user role and selected team
  const availableTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (isAdmin && selectedTeam) {
      // Admin with team selected: show templates for that team
      return teamAssignments.some(assignment => 
        assignment.template_id === template.id && 
        assignment.team_id === selectedTeam
      );
    } else if (isAdmin && !selectedTeam) {
      // Admin without team selected: show all templates
      return true;
    } else {
      // Regular user: show templates assigned to their teams
      return teamAssignments.some(assignment => 
        assignment.template_id === template.id
      ) || template.created_by === user?.id;
    }
  });

  const handleStartCount = (template: InventoryTemplate) => {
    const teamData = selectedTeam ? teams.find(t => t.id === selectedTeam) : undefined;
    onStartCount(template, teamData ? { id: teamData.id, name: teamData.name } : undefined);
    setOpen(false);
    setSearchTerm('');
    setSelectedTeam('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isAdmin ? 'Select Team and Template for Count' : 'Select Template for Count'}
            {isAdmin && <Shield className="h-4 w-4 text-blue-500" />}
          </DialogTitle>
          <DialogDescription>
            {isAdmin 
              ? 'Choose a team and inventory template to start counting. As an admin, you can run counts for any team.'
              : 'Choose an inventory template to start counting. You can only count templates assigned to your team.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Team Selector for Admins */}
          {isAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Team</label>
              <TeamSelect
                teams={teams}
                isLoading={teamsLoading}
                selectedTeam={selectedTeam}
                onTeamChange={setSelectedTeam}
                optional={true}
              />
              {selectedTeam && (
                <p className="text-xs text-muted-foreground">
                  Running count for: {teams.find(t => t.id === selectedTeam)?.name}
                </p>
              )}
            </div>
          )}
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {availableTemplates.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'No templates match your search' 
                    : isAdmin && !selectedTeam
                    ? 'Select a team to see available templates'
                    : 'No templates available'
                  }
                </p>
              </div>
            ) : (
              availableTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {template.name}
                      <Badge variant="outline">
                        Template
                      </Badge>
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Items
                      </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {teamAssignments.filter(a => a.template_id === template.id).length} teams
                        </span>
                      </div>
                      
                      <Button 
                        onClick={() => handleStartCount(template)}
                        className="w-full"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Count
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};