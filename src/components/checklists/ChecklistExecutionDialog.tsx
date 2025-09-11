import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChecklistExecution } from '@/types/checklist';
import {
  useChecklistExecutionItems,
  useCompleteChecklistItem,
  useCompleteChecklistExecution,
  useStartChecklistExecution,
} from '@/hooks/useChecklistExecutions';
import { Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface ChecklistExecutionDialogProps {
  execution: ChecklistExecution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChecklistExecutionDialog: React.FC<ChecklistExecutionDialogProps> = ({
  execution,
  open,
  onOpenChange,
}) => {
  const [notes, setNotes] = useState('');
  
  const { data: items, isLoading } = useChecklistExecutionItems(execution?.id || '');
  const startExecution = useStartChecklistExecution();
  const completeItem = useCompleteChecklistItem();
  const completeExecution = useCompleteChecklistExecution();

  useEffect(() => {
    if (execution?.notes) {
      setNotes(execution.notes);
    } else {
      setNotes('');
    }
  }, [execution]);

  const handleStartExecution = async () => {
    if (execution && execution.status === 'pending') {
      await startExecution.mutateAsync(execution.id);
    }
  };

  const handleCompleteItem = async (itemId: string, isCompleted: boolean, itemNotes?: string) => {
    await completeItem.mutateAsync({
      itemId,
      isCompleted,
      notes: itemNotes,
    });
  };

  const handleCompleteExecution = async () => {
    if (execution) {
      await completeExecution.mutateAsync({
        executionId: execution.id,
        notes,
      });
      onOpenChange(false);
    }
  };

  const completedItemsCount = items?.filter(item => item.is_completed).length || 0;
  const totalItemsCount = items?.length || 0;
  const allItemsCompleted = completedItemsCount === totalItemsCount && totalItemsCount > 0;

  if (!execution) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {execution.checklist?.name}
            <Badge variant="outline">
              {format(new Date(execution.execution_date), 'MMM d, yyyy')}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {execution.checklist?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {/* Execution Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <Badge className="capitalize">
                    {execution.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">
                    {completedItemsCount}/{totalItemsCount} items completed
                  </span>
                </div>

                {execution.checklist?.execution_window_start && execution.checklist?.execution_window_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Window</span>
                    <span className="text-sm">
                      {execution.checklist.execution_window_start} - {execution.checklist.execution_window_end}
                    </span>
                  </div>
                )}
              </div>

              {/* Start Button */}
              {execution.status === 'pending' && (
                <Button
                  onClick={handleStartExecution}
                  className="w-full"
                  disabled={startExecution.isPending}
                >
                  {startExecution.isPending ? 'Starting...' : 'Start Checklist'}
                </Button>
              )}

              {/* Checklist Items */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Checklist Items
                  </h3>
                  
                  <div className="space-y-3">
                    {items?.map((item, index) => (
                      <ChecklistItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        onComplete={handleCompleteItem}
                        disabled={execution.status === 'verified' || execution.status === 'pending'}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {execution.status !== 'pending' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Execution Notes</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this checklist execution..."
                      disabled={execution.status === 'verified'}
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Complete Button */}
              {execution.status === 'in_progress' && (
                <Button
                  onClick={handleCompleteExecution}
                  className="w-full"
                  disabled={!allItemsCompleted || completeExecution.isPending}
                >
                  {completeExecution.isPending ? 'Completing...' : 'Complete Checklist'}
                </Button>
              )}

              {/* Verification Info */}
              {execution.status === 'verified' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Verified by Manager</span>
                  </div>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div>Verified by: {execution.verifier?.name}</div>
                    <div>Verification Score: {execution.verification_score}/100</div>
                    <div>Total Score: {execution.total_score}/100</div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ChecklistItemCardProps {
  item: any;
  index: number;
  onComplete: (itemId: string, isCompleted: boolean, notes?: string) => void;
  disabled: boolean;
}

const ChecklistItemCard: React.FC<ChecklistItemCardProps> = ({
  item,
  index,
  onComplete,
  disabled,
}) => {
  const [itemNotes, setItemNotes] = useState(item.notes || '');

  const handleCheckChange = (checked: boolean) => {
    onComplete(item.id, checked, itemNotes);
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={item.is_completed}
          onCheckedChange={handleCheckChange}
          disabled={disabled}
          className="mt-1"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {index + 1}. {item.checklist_item?.title}
            </span>
            {item.checklist_item?.is_required && (
              <Badge variant="outline" className="text-xs">Required</Badge>
            )}
            {item.is_verified && (
              <Badge className="text-xs bg-blue-100 text-blue-800">Verified</Badge>
            )}
          </div>
          {item.checklist_item?.description && (
            <p className="text-sm text-muted-foreground">
              {item.checklist_item.description}
            </p>
          )}
        </div>
        {item.is_completed ? (
          <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
        ) : (
          <AlertCircle className="h-5 w-5 text-orange-500 mt-1" />
        )}
      </div>

      {item.is_completed && (
        <div className="ml-8 space-y-2">
          <Textarea
            value={itemNotes}
            onChange={(e) => setItemNotes(e.target.value)}
            placeholder="Add notes for this item..."
            disabled={disabled || item.is_verified}
            rows={2}
            className="text-sm"
          />
          {item.completed_at && (
            <p className="text-xs text-muted-foreground">
              Completed: {format(new Date(item.completed_at), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};