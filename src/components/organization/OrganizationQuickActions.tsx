
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import InviteCodeDialog from './InviteCodeDialog';

const OrganizationQuickActions: React.FC = () => {
  const { user } = useAuth();

  const canCreateUsers = user && ['superadmin', 'admin'].includes(user.role);
  const canViewReports = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link to="/dashboard/tasks">
          <Button className="w-full justify-start" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create New Task
          </Button>
        </Link>
        
        <Link to="/dashboard/projects">
          <Button className="w-full justify-start" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        </Link>

        {canCreateUsers && (
          <InviteCodeDialog>
            <Button className="w-full justify-start" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </InviteCodeDialog>
        )}

        {canViewReports && (
          <Link to="/dashboard/reports">
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationQuickActions;
