
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { useEnhancedUserManagement } from '@/hooks/useEnhancedUserManagement';

interface UserImpactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

const UserImpactDialog: React.FC<UserImpactDialogProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const { getUserImpactAnalysis } = useEnhancedUserManagement();
  const [impact, setImpact] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      setLoading(true);
      getUserImpactAnalysis(user.id)
        .then(setImpact)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, user?.id, getUserImpactAnalysis]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            User Impact Analysis - {user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : impact ? (
            <>
              {/* User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Name:</span>
                    <span className="text-sm font-medium">{impact.user_info.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Email:</span>
                    <span className="text-sm font-medium">{impact.user_info.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Role:</span>
                    <Badge variant="outline">{impact.user_info.role}</Badge>
                  </div>
                  {impact.is_sole_superadmin && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-700">
                        This is the only superadmin in the organization
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Activity & Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Tasks assigned:</span>
                        <Badge variant="outline">{impact.tasks_assigned}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Project tasks:</span>
                        <Badge variant="outline">{impact.project_tasks_assigned}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Projects managed:</span>
                        <Badge variant="outline">{impact.projects_managed}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Chat rooms created:</span>
                        <Badge variant="outline">{impact.chat_rooms_created}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Team memberships:</span>
                        <Badge variant="outline">{impact.team_memberships}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Deletion Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Deletion Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {impact.can_be_deleted ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-700">
                          User can be safely deleted
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-700">
                          {impact.deletion_blocked_reason}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {impact.can_be_deleted && (
                    <p className="text-xs text-muted-foreground mt-2">
                      All associated tasks and projects will be properly unassigned 
                      or transferred during the deletion process.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Failed to load impact analysis</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserImpactDialog;
