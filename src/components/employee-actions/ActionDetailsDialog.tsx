import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  MessageSquare, 
  Calendar,
  User,
  Building2,
  AlertTriangle,
  Clock,
  FileText,
  Target
} from 'lucide-react';
import { useEmployeeActions } from '@/hooks/employeeActions/useEmployeeActions';
import { useAuth } from '@/contexts/AuthContext';
import type { EmployeeAction } from '@/types/employeeActions';
import { ACTION_TYPE_LABELS, ACTION_SEVERITY_LABELS, ACTION_STATUS_LABELS } from '@/types/employeeActions';

interface ActionDetailsDialogProps {
  action: EmployeeAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
}

export const ActionDetailsDialog: React.FC<ActionDetailsDialogProps> = ({
  action,
  open,
  onOpenChange,
  canManage,
}) => {
  const { user } = useAuth();
  const { completeAction, submitAppeal, isCompleting, isSubmittingAppeal } = useEmployeeActions();
  const [appealReason, setAppealReason] = useState('');
  const [showAppealForm, setShowAppealForm] = useState(false);

  const isRecipient = user?.id === action.recipient_id;
  const canAppeal = isRecipient && action.status === 'active' && !action.appeal_submitted_at;
  const canComplete = canManage && action.status === 'active';

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200';
      case 'appealed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCompleteAction = () => {
    completeAction(action.id);
    onOpenChange(false);
  };

  const handleSubmitAppeal = () => {
    if (appealReason.trim()) {
      submitAppeal({ id: action.id, reason: appealReason });
      setAppealReason('');
      setShowAppealForm(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{action.title}</DialogTitle>
              <DialogDescription className="mt-2">
                Action details and current status
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getSeverityColor(action.severity)}>
                {ACTION_SEVERITY_LABELS[action.severity]}
              </Badge>
              <Badge variant="outline" className={getStatusColor(action.status)}>
                {ACTION_STATUS_LABELS[action.status]}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Action Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <p className="mt-1">{ACTION_TYPE_LABELS[action.action_type]}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                  <p className="mt-1 capitalize">{action.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p className="mt-1">{format(new Date(action.created_at), 'PPP')}</p>
                </div>
                {action.due_date && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                    <p className="mt-1">{format(new Date(action.due_date), 'PPP')}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Employee</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{action.recipient_name}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Issued By</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{action.issuer_name}</span>
                  </div>
                </div>
                {action.team_name && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Team</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{action.team_name}</span>
                    </div>
                  </div>
                )}
                {action.follow_up_date && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Follow-up Date</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(action.follow_up_date), 'PPP')}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{action.description}</p>
            </CardContent>
          </Card>

          {/* Improvement Plan */}
          {action.improvement_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {action.action_type.includes('coaching') ? 'Development Plan' : 'Corrective Actions Required'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{action.improvement_plan}</p>
              </CardContent>
            </Card>
          )}

          {/* Expected Outcomes */}
          {action.expected_outcomes && (
            <Card>
              <CardHeader>
                <CardTitle>Expected Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{action.expected_outcomes}</p>
              </CardContent>
            </Card>
          )}

          {/* Appeal Information */}
          {action.status === 'appealed' && action.appeal_reason && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Appeal Submitted
                </CardTitle>
                <CardDescription>
                  Appeal submitted on {action.appeal_submitted_at && format(new Date(action.appeal_submitted_at), 'PPP')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{action.appeal_reason}</p>
              </CardContent>
            </Card>
          )}

          {/* Appeal Form */}
          {canAppeal && showAppealForm && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Appeal</CardTitle>
                <CardDescription>
                  Explain why you believe this action should be reconsidered
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="appealReason">Appeal Reason</Label>
                  <Textarea
                    id="appealReason"
                    placeholder="Provide a detailed explanation for your appeal..."
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    className="min-h-[100px] mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitAppeal}
                    disabled={isSubmittingAppeal || !appealReason.trim()}
                  >
                    {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAppealForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              {canAppeal && !showAppealForm && (
                <Button
                  variant="outline"
                  onClick={() => setShowAppealForm(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit Appeal
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {canComplete && (
                <Button
                  onClick={handleCompleteAction}
                  disabled={isCompleting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCompleting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}
              
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};