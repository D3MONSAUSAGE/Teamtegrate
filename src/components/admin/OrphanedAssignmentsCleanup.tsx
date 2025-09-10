import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import { useOrphanedTrainingAssignments, useCleanupOrphanedAssignments, useOrphanedAssignmentsCount } from '@/hooks/useOrphanedTrainingAssignments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

export function OrphanedAssignmentsCleanup() {
  const { user } = useAuth();
  const { data: orphanedAssignments = [], isLoading, refetch } = useOrphanedTrainingAssignments();
  const { data: orphanedCount = 0 } = useOrphanedAssignmentsCount();
  const cleanupMutation = useCleanupOrphanedAssignments();
  const [showDetails, setShowDetails] = useState(false);

  const isAdmin = user && ['admin', 'superadmin', 'manager'].includes(user.role);

  if (!isAdmin) {
    return null;
  }

  const handleCleanup = async () => {
    try {
      await cleanupMutation.mutateAsync();
      await refetch(); // Refresh the list after cleanup
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'assigned':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case 'compliance_training':
        return 'Compliance Training';
      case 'quiz':
        return 'Quiz';
      case 'course':
        return 'Course';
      default:
        return type;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <CardTitle>Orphaned Training Assignments</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {orphanedCount > 0 && (
              <Badge variant="destructive" className="font-mono">
                {orphanedCount}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <CardDescription>
          Training assignments that reference deleted courses, quizzes, or compliance templates.
          These assignments need to be cleaned up to maintain data integrity.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading orphaned assignments...</span>
          </div>
        ) : orphanedAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-success mb-3" />
            <h3 className="text-lg font-semibold text-success">All Clean!</h3>
            <p className="text-muted-foreground">No orphaned training assignments found.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {orphanedAssignments.length} orphaned assignment{orphanedAssignments.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={cleanupMutation.isPending}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clean Up All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clean Up Orphaned Assignments</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>This will permanently delete {orphanedAssignments.length} orphaned training assignments and their related data:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Training assignments</li>
                          <li>Associated audit records</li>
                          <li>Certificate uploads (if any)</li>
                          <li>Related compliance records</li>
                        </ul>
                        <p className="font-semibold text-destructive">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCleanup}
                        disabled={cleanupMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {cleanupMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                        Clean Up All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {showDetails && (
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                {orphanedAssignments.map((assignment) => (
                  <div 
                    key={assignment.assignment_id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{assignment.content_title}</span>
                        <Badge variant="outline" className="text-xs">
                          {getAssignmentTypeLabel(assignment.assignment_type)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(assignment.status)} className="text-xs">
                          {assignment.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-xs text-muted-foreground">Content Deleted</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}