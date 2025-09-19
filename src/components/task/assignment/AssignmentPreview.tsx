import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Users, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { AssignmentPreview as AssignmentPreviewType } from '@/services/EnhancedTaskAssignmentService';

interface AssignmentPreviewProps {
  preview: AssignmentPreviewType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const AssignmentPreview: React.FC<AssignmentPreviewProps> = ({
  preview,
  open,
  onOpenChange,
  onConfirm
}) => {
  const renderAssignmentSection = (
    title: string,
    assignments: any,
    icon: React.ReactNode
  ) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {assignments.individual && assignments.individual.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Individual Assignments:</div>
            <div className="flex flex-wrap gap-1">
              {assignments.individual.map((person: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {person.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {assignments.team && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Team Assignment:</div>
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {assignments.team.name}
            </Badge>
          </div>
        )}
        
        {!assignments.individual?.length && !assignments.team && (
          <div className="text-sm text-muted-foreground italic">No assignments</div>
        )}
        
        <div className="mt-2 text-xs text-muted-foreground">
          Source: {assignments.source}
        </div>
      </CardContent>
    </Card>
  );

  const hasConflicts = preview.conflicts && preview.conflicts.length > 0;
  const hasChanges = preview.changes && preview.changes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Assignment Preview
          </DialogTitle>
          <DialogDescription>
            Review the changes that will be made to the task assignment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conflicts Alert */}
          {hasConflicts && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Assignment Conflicts Detected:</div>
                  <ul className="list-disc list-inside text-sm">
                    {preview.conflicts.map((conflict, index) => (
                      <li key={index}>{conflict}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Assignment Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Current Assignments */}
            <div>
              {renderAssignmentSection(
                'Current Assignment',
                preview.currentAssignments,
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Proposed Assignments */}
            <div>
              {renderAssignmentSection(
                'New Assignment',
                preview.proposedAssignments,
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>

          {/* Changes Summary */}
          {hasChanges && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Changes Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1 text-sm">
                  {preview.changes.map((change, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* No Changes */}
          {!hasChanges && !hasConflicts && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No changes detected. The assignment is already as specified.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={hasConflicts}
          >
            {hasConflicts ? 'Resolve Conflicts First' : 'Confirm Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentPreview;