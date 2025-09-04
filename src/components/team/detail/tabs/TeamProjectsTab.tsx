import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  Plus,
  Filter,
  FolderOpen,
  Calendar,
  DollarSign,
  Users,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TeamProjectsView from '@/components/team/detail/TeamProjectsView';

interface TeamProjectsTabProps {
  teamId: string;
}

const TeamProjectsTab: React.FC<TeamProjectsTabProps> = ({ teamId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Project Management Actions */}
      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
        <Badge variant="outline" className="text-xs">Quick Actions:</Badge>
        <Button variant="ghost" size="sm" className="h-7 text-xs">Assign Team</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs">Bulk Update</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs">Export List</Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs">Templates</Button>
      </div>

      {/* Enhanced Projects View */}
      <div className="relative">
        <TeamProjectsView teamId={teamId} />
      </div>

      {/* Project Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-lg font-bold text-blue-600">4</p>
          <p className="text-xs text-muted-foreground">Active Projects</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-lg font-bold text-green-600">2</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-lg font-bold text-yellow-600">1</p>
          <p className="text-xs text-muted-foreground">On Hold</p>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-lg font-bold text-purple-600">85%</p>
          <p className="text-xs text-muted-foreground">Success Rate</p>
        </div>
      </div>
    </div>
  );
};

export default TeamProjectsTab;