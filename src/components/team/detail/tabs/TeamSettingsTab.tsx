import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings,
  Shield,
  Users,
  AlertTriangle,
  Crown,
  Lock,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeamSettingsTabProps {
  team: any;
  teamMembers: any[];
}

const TeamSettingsTab: React.FC<TeamSettingsTabProps> = ({ team, teamMembers }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
    isActive: team.is_active
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: team.name,
      description: team.description || '',
      isActive: team.is_active
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Team Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Team Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Team Name</label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
              />
            ) : (
              <p className="p-2 bg-muted/50 rounded">{team.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter team description"
                rows={3}
              />
            ) : (
              <p className="p-2 bg-muted/50 rounded min-h-20">
                {team.description || 'No description provided'}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <label className="text-sm font-medium">Team Status</label>
              <p className="text-xs text-muted-foreground">
                {formData.isActive ? 'Team is active and visible' : 'Team is inactive and hidden'}
              </p>
            </div>
            {isEditing ? (
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            ) : (
              <Badge variant={team.is_active ? "default" : "secondary"}>
                {team.is_active ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Edit Information
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <label className="text-sm font-medium">Current Manager</label>
              <p className="text-xs text-muted-foreground">
                {team.manager_name || 'No manager assigned'}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Change Manager
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <label className="text-sm font-medium">Team Size</label>
              <p className="text-xs text-muted-foreground">
                {team.member_count} total members
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="h-4 w-4" />
              Manage Members
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permissions & Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <label className="text-sm font-medium">Project Access</label>
                <p className="text-xs text-muted-foreground">Who can view team projects</p>
              </div>
              <Badge variant="outline">Team Members Only</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <label className="text-sm font-medium">Task Management</label>
                <p className="text-xs text-muted-foreground">Who can assign tasks</p>
              </div>
              <Badge variant="outline">Managers Only</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <label className="text-sm font-medium">Member Invitation</label>
                <p className="text-xs text-muted-foreground">Who can invite new members</p>
              </div>
              <Badge variant="outline">Managers + Admins</Badge>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="gap-2">
            <Lock className="h-4 w-4" />
            Configure Permissions
          </Button>
        </CardContent>
      </Card>

      {/* Advanced Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Advanced Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
            <h4 className="font-medium text-red-800 dark:text-red-400 mb-2">Danger Zone</h4>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              These actions cannot be undone. Please proceed with caution.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Archive Team</p>
                  <p className="text-xs text-muted-foreground">Hide team but keep all data</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Archive
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Delete Team</p>
                  <p className="text-xs text-muted-foreground">Permanently delete team and all associated data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Team</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{team.name}"? This action cannot be undone and will permanently remove all team data, projects, and tasks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                        Delete Team
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamSettingsTab;