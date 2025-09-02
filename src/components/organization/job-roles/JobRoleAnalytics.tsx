import React from 'react';
import { useJobRoles } from '@/hooks/useJobRoles';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';

export const JobRoleAnalytics: React.FC = () => {
  const { jobRoles } = useJobRoles();
  const { users } = useEnhancedUserManagement();

  const totalUsers = users?.length || 0;
  const activeRoles = jobRoles.filter(role => role.is_active).length;
  const inactiveRoles = jobRoles.filter(role => !role.is_active).length;

  // For now, we'll show simplified analytics since we don't have direct access to user job roles
  // This would need to be enhanced with proper data fetching

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Job Roles</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRoles}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs px-1">
                {inactiveRoles} inactive
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              In your organization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              To be calculated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Roles/User</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              To be calculated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Job Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>Job Role Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobRoles.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No job roles created yet
              </p>
            ) : (
              jobRoles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant={role.is_active ? "default" : "secondary"}>
                      {role.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div>
                      <h3 className="font-medium">{role.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {role.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(role.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. Create job roles in the "Manage Roles" tab</p>
            <p>2. Use the "Assignment Dashboard" to assign roles to users</p>
            <p>3. Use "Bulk Assignment" to assign roles to multiple users at once</p>
            <p>4. View detailed analytics once assignments are made</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};