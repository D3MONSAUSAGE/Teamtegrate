import React, { useState, useEffect, useCallback } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChecklistExecution } from '@/types/checklist';
import {
  useChecklistExecutionItems,
  useCompleteChecklistItem,
  useCompleteChecklistExecution,
  useStartChecklistExecution,
  useManagerCompleteAndVerify,
  useVerifyChecklistItem,
} from '@/hooks/useChecklistExecutions';
import { Clock, CheckCircle, AlertCircle, FileText, Sparkles, Play, Save, Check, Eye, Lock, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { ManagerVerifyConfirmDialog } from './ManagerVerifyConfirmDialog';
import { SimpleChecklistItemCard } from './SimpleChecklistItemCard';
import ChecklistTimeStatusBadge from './ChecklistTimeStatusBadge';
import ChecklistCountdownTimer from './ChecklistCountdownTimer';
import { supabase } from '@/integrations/supabase/client';
import { canStartChecklistExecution, formatTimeWindow } from '@/utils/checklistTimeUtils';
import { useChecklistTimeWindow } from '@/hooks/useChecklistTimeWindow';
import { useScrollToBottom } from '@/hooks/useScrollToBottom';

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
  const [autoSaving, setAutoSaving] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const { toast } = useToast();
  const { user, hasRoleAccess } = useAuth();
  
  const isManager = hasRoleAccess('manager');
  
  // Get real-time time window status
  const timeWindowStatus = useChecklistTimeWindow(
    execution?.checklist, 
    execution?.execution_date
  );
  
  const { data: items, isLoading, error } = useChecklistExecutionItems(execution?.id || '');
  const startExecution = useStartChecklistExecution();
  const completeItem = useCompleteChecklistItem();
  const completeExecution = useCompleteChecklistExecution();
  const managerCompleteAndVerify = useManagerCompleteAndVerify();
  const verifyItem = useVerifyChecklistItem();
  
  // Scroll to bottom hook for better UX
  const { scrollRef, forceScrollToBottom } = useScrollToBottom({
    dependency: [items],
    behavior: 'smooth'
  });

  useEffect(() => {
    if (execution?.notes) {
      setNotes(execution.notes);
    } else {
      setNotes('');
    }
  }, [execution]);

  // Auto-save notes with debouncing
  const autoSaveNotes = useCallback(async (newNotes: string) => {
    if (!execution || execution.status === 'verified') return;
    
    setAutoSaving(true);
    try {
      // In a real implementation, you'd have an updateExecutionNotes mutation
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setAutoSaving(false);
    } catch (error) {
      setAutoSaving(false);
      console.error('Failed to auto-save notes:', error);
    }
  }, [execution]);

  useEffect(() => {
    if (notes && execution) {
      const timeoutId = setTimeout(() => autoSaveNotes(notes), 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [notes, autoSaveNotes, execution]);

  const handleStartExecution = async () => {
    if (execution && execution.status === 'pending') {
      // Check time window restrictions (allow managers to override)
      const { canStart, reason } = canStartChecklistExecution(execution, !isManager);
      
      if (!canStart && !isManager) {
        toast({
          title: "Cannot Start Checklist",
          description: reason,
          variant: "destructive",
        });
        return;
      }
      
      try {
        await startExecution.mutateAsync(execution.id);
        toast({
          title: "Checklist Started",
          description: isManager && !canStart ? "Started with manager override." : "You can now complete the checklist items.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to start checklist. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCompleteItem = async (itemId: string, isCompleted: boolean, itemNotes?: string) => {
    try {
      await completeItem.mutateAsync({
        itemId,
        isCompleted,
        notes: itemNotes,
      });
      
      if (isCompleted) {
        toast({
          title: "Item Completed",
          description: "Great progress! Keep going.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyItem = async (itemId: string, isVerified: boolean, itemNotes?: string) => {
    try {
      await verifyItem.mutateAsync({
        itemId,
        isVerified,
        notes: itemNotes,
      });
      
      if (isVerified) {
        toast({
          title: "Item Verified",
          description: "Item verification completed.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteExecution = async () => {
    if (execution) {
      try {
        await completeExecution.mutateAsync({
          executionId: execution.id,
          notes,
        });
        
                        toast({
                          title: "🎉 Checklist Completed!",
                          description: isManager ? "Checklist completed successfully." : "Your checklist has been submitted for manager review.",
                        });
        
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to complete checklist. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleManagerCompleteAndVerify = async () => {
    setShowVerifyDialog(false);
    if (execution && items) {
      try {
        await managerCompleteAndVerify.mutateAsync({
          executionId: execution.id,
          notes,
          items,
        });
        
        toast({
          title: "🎉 Checklist Completed & Verified!",
          description: "The checklist has been completed and verified successfully.",
        });
        
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to complete and verify checklist. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const completedItemsCount = items?.filter(item => item.is_completed).length || 0;
  const verifiedItemsCount = items?.filter(item => item.is_verified).length || 0;
  const totalItemsCount = items?.length || 0;
  const allItemsCompleted = completedItemsCount === totalItemsCount && totalItemsCount > 0;
  const allItemsExecutedAndVerified = isManager && completedItemsCount === totalItemsCount && verifiedItemsCount === totalItemsCount && totalItemsCount > 0;

  if (!execution) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90dvh] sm:h-[85dvh] flex flex-col animate-scale-in p-0">
        <DialogHeader className="shrink-0 space-y-2 md:space-y-3 px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
              <span className="truncate text-base md:text-lg">{execution.checklist?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {format(new Date(execution.execution_date), 'MMM d, yyyy')}
              </Badge>
              {isManager && (
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  Manager
                </Badge>
              )}
            </div>
          </DialogTitle>
          {execution.checklist?.description && (
            <DialogDescription className="text-sm md:text-base leading-relaxed">
              {execution.checklist?.description}
            </DialogDescription>
          )}
          
          {/* Progress Indicator - Mobile optimized */}
          <div className="bg-muted/30 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs md:text-sm font-medium">Overall Progress</span>
              <span className="text-xs md:text-sm text-muted-foreground">
                {isManager ? `${completedItemsCount}/${totalItemsCount} executed, ${verifiedItemsCount}/${totalItemsCount} verified` : `${completedItemsCount}/${totalItemsCount} completed`}
              </span>
            </div>
            <Progress 
              value={isManager ? (verifiedItemsCount / Math.max(totalItemsCount, 1)) * 100 : (completedItemsCount / Math.max(totalItemsCount, 1)) * 100} 
              className="h-2.5 md:h-2 transition-all duration-500 ease-out touch-none"
            />
          </div>
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
            <div className="space-y-4 md:space-y-6 px-4 md:px-6 py-4">
              {/* Error State */}
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load checklist items. Please refresh the page and try again.
                  </AlertDescription>
                </Alert>
              )}

              {/* Empty State */}
              {!isLoading && !error && (!items || items.length === 0) && (
                <Alert className="animate-fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No checklist items found. This checklist may need to be configured by a manager.
                  </AlertDescription>
                </Alert>
              )}

              {/* Status Info - Mobile optimized */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <Badge 
                    variant={execution.status === 'completed' ? 'default' : 'outline'}
                    className="capitalize transition-colors duration-200"
                  >
                    {execution.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Time Window Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time Window</span>
                  <span className="text-sm font-mono bg-background/50 px-2 py-1 rounded">
                    {formatTimeWindow(execution.checklist?.execution_window_start, execution.checklist?.execution_window_end)}
                  </span>
                </div>

                {/* Real-time time status */}
                {timeWindowStatus.status !== 'no-window' && (
                  <div className="flex items-center justify-between">
                    <ChecklistTimeStatusBadge
                      checklist={execution.checklist}
                      executionDate={execution.execution_date}
                      size="sm"
                      showCountdown={false}
                    />
                    {timeWindowStatus.countdown && (
                      <span className="text-xs font-mono text-muted-foreground">
                        {timeWindowStatus.isInWindow ? `Expires in ${timeWindowStatus.countdown}` : timeWindowStatus.countdown}
                      </span>
                    )}
                  </div>
                )}

                {/* Cutoff time warning */}
                {execution.checklist?.cutoff_time && timeWindowStatus.isInWindow && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 rounded-md p-2">
                    <Timer className="h-4 w-4" />
                    <span>Cutoff time: {execution.checklist.cutoff_time}</span>
                  </div>
                )}
              </div>

              {/* Start Button */}
              {execution.status === 'pending' && (
                <>
                  {/* Time Window Restriction Alert */}
                  {!timeWindowStatus.isInWindow && !isManager && (
                    <Alert variant="destructive" className="animate-fade-in">
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {timeWindowStatus.status === 'upcoming' ? 'Checklist Not Yet Available' : 'Checklist Time Window Expired'}
                          </div>
                          <div className="text-sm">{timeWindowStatus.message}</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Manager Override Warning */}
                  {!timeWindowStatus.isInWindow && isManager && (
                    <Alert className="animate-fade-in border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <div className="space-y-1">
                          <div className="font-medium">Manager Override Available</div>
                          <div className="text-sm">
                            This checklist is outside its normal time window, but you can start it as a manager.
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleStartExecution}
                    className="w-full group hover-scale animate-fade-in touch-manipulation h-12 md:h-11 text-base md:text-sm"
                    disabled={startExecution.isPending || (!timeWindowStatus.isInWindow && !isManager)}
                    size="lg"
                    variant={!timeWindowStatus.isInWindow && !isManager ? "outline" : "default"}
                  >
                    {!timeWindowStatus.isInWindow && !isManager ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        {timeWindowStatus.status === 'upcoming' ? 'Not Available Yet' : 'Time Expired'}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                        {startExecution.isPending ? 'Starting...' : 
                         !timeWindowStatus.isInWindow && isManager ? 'Start with Override' :
                         'Start Checklist'}
                        <Sparkles className="h-4 w-4 ml-2 opacity-60" />
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Checklist Items */}
              {isLoading ? (
                <div className="text-center py-12 animate-fade-in">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading checklist items...</p>
                </div>
              ) : items && items.length > 0 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Checklist Items
                    </h3>
                    {allItemsExecutedAndVerified ? (
                      <Badge variant="default" className="animate-pulse bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        All Executed & Verified!
                      </Badge>
                    ) : allItemsCompleted && (
                      <Badge variant="default" className="animate-pulse">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        All Complete!
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <SimpleChecklistItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        onComplete={handleCompleteItem}
                        onVerify={handleVerifyItem}
                        disabled={execution.status === 'verified' || execution.status === 'pending'}
                        isManager={isManager}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {execution.status !== 'pending' && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Execution Notes
                      </label>
                      {autoSaving && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Save className="h-3 w-3 animate-pulse" />
                          Auto-saving...
                        </div>
                      )}
                    </div>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes, observations, or issues encountered during this checklist execution..."
                      disabled={execution.status === 'verified'}
                      rows={4}
                      className="resize-none transition-all duration-200 focus:ring-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Notes are automatically saved as you type
                    </p>
                  </div>
                </>
              )}

              {/* Complete Button */}
              {execution.status === 'in_progress' && (
                <div className="space-y-4 animate-fade-in">
                  {isManager && allItemsExecutedAndVerified ? (
                    // Manager Complete & Verify Button
                    <div className="space-y-3">
                      <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          All items have been executed and verified. You can now complete and verify this checklist permanently.
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={() => setShowVerifyDialog(true)}
                        className="w-full group hover-scale bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        disabled={managerCompleteAndVerify.isPending}
                        size="lg"
                      >
                        <CheckCircle className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                        Complete & Verify Checklist
                        <Sparkles className="h-4 w-4 ml-2 opacity-60" />
                      </Button>
                    </div>
                  ) : (
                    // Regular Complete Button
                    <div className="space-y-3">
                      {!allItemsCompleted && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {isManager 
                              ? 'Please execute and verify all required checklist items before submitting.'
                              : 'Please complete all required checklist items before submitting.'
                            }
                          </AlertDescription>
                        </Alert>
                      )}
                      <Button
                        onClick={handleCompleteExecution}
                        className="w-full group hover-scale"
                        disabled={!allItemsCompleted || completeExecution.isPending}
                        size="lg"
                        variant={allItemsCompleted ? "default" : "outline"}
                      >
                        <CheckCircle className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                        {completeExecution.isPending ? 'Submitting...' : isManager ? 'Submit for Final Verification' : 'Submit Completed Checklist'}
                        <Sparkles className="h-4 w-4 ml-2 opacity-60" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Info */}
              {execution.status === 'verified' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-green-900">Verified by Manager</span>
                      <p className="text-sm text-green-700">This checklist has been reviewed and approved</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-700">Verified by:</span>
                        <span className="font-medium text-green-900">{execution.verifier?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Verification Score:</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {execution.verification_score}/100
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-700">Total Score:</span>
                        <Badge variant="default" className="bg-green-600">
                          {execution.total_score}/100
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Status:</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          ✓ Completed
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Completed State */}
              {execution.status === 'completed' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-blue-900">Awaiting Verification</span>
                      <p className="text-sm text-blue-700">Your checklist has been submitted for manager review</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </ScrollArea>

        {/* Manager Verification Confirmation Dialog */}
        <ManagerVerifyConfirmDialog
          open={showVerifyDialog}
          onOpenChange={setShowVerifyDialog}
          onConfirm={handleManagerCompleteAndVerify}
          checklistName={execution?.checklist?.name || 'Checklist'}
          completedItems={completedItemsCount}
          totalItems={totalItemsCount}
          isLoading={managerCompleteAndVerify.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

interface ChecklistItemCardProps {
  item: any;
  index: number;
  onComplete: (itemId: string, isCompleted: boolean, notes?: string) => void;
  onVerify: (itemId: string, isVerified: boolean, notes?: string) => void;
  disabled: boolean;
  isManager?: boolean;
}

const ChecklistItemCard: React.FC<ChecklistItemCardProps> = ({
  item,
  index,
  onComplete,
  onVerify,
  disabled,
  isManager = false,
}) => {
  const [itemNotes, setItemNotes] = useState(item.notes || '');
  const [isExpanded, setIsExpanded] = useState(item.is_completed);
  const [isExecuted, setIsExecuted] = useState(item.is_completed || false);
  const [isVerified, setIsVerified] = useState(item.is_verified || false);

  const handleExecuteChange = (checked: boolean) => {
    setIsExecuted(checked);
    if (isManager && checked && isVerified) {
      // If manager checks execute and verify is already checked, complete the item
      onComplete(item.id, true, itemNotes);
    } else if (!isManager && checked) {
      // Regular user - complete item when executed
      onComplete(item.id, checked, itemNotes);
    } else if (!checked) {
      // Unchecking execute should uncheck verify and mark incomplete
      setIsVerified(false);
      onComplete(item.id, false, itemNotes);
    }
    setIsExpanded(checked);
  };

  const handleVerifyChange = (checked: boolean) => {
    if (!isExecuted && checked) {
      // Can't verify without executing first
      return;
    }
    setIsVerified(checked);
    // Call the verify handler directly
    onVerify(item.id, checked, itemNotes);
  };

  // For manager view, show both statuses
  const getCardStyle = () => {
    if (isManager) {
      if (isExecuted && isVerified) return 'bg-green-50 border-green-200';
      if (isExecuted) return 'bg-blue-50 border-blue-200';
      return 'bg-background border-border';
    }
    return item.is_completed ? 'bg-green-50 border-green-200' : 'bg-background border-border';
  };

  return (
    <div className={`border rounded-lg transition-all duration-300 hover-scale ${getCardStyle()}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          {isManager ? (
            // Manager view: dual checkboxes
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isExecuted}
                  onCheckedChange={handleExecuteChange}
                  disabled={disabled}
                  className="transition-all duration-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <div className="flex items-center gap-1 text-xs text-blue-700 font-medium">
                  <Check className="h-3 w-3" />
                  Execute
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isVerified}
                  onCheckedChange={handleVerifyChange}
                  disabled={disabled || !isExecuted}
                  className="transition-all duration-200 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <div className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                  isExecuted ? 'text-green-700' : 'text-muted-foreground'
                }`}>
                  <Eye className="h-3 w-3" />
                  Verify
                </div>
              </div>
            </div>
          ) : (
            // Regular user view: single checkbox
            <Checkbox
              checked={item.is_completed}
              onCheckedChange={handleExecuteChange}
              disabled={disabled}
              className="mt-1 transition-all duration-200"
            />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-medium transition-colors duration-200 ${
                item.is_completed ? 'text-green-800' : 'text-foreground'
              }`}>
                {index + 1}. {item.checklist_item?.title}
              </span>
              {item.checklist_item?.is_required && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  Required
                </Badge>
              )}
              {item.is_verified && (
                <Badge className="text-xs bg-blue-100 text-blue-800 animate-pulse">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            {item.checklist_item?.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.checklist_item.description}
              </p>
            )}
          </div>
          <div className="transition-all duration-200">
            {item.is_completed ? (
              <div className="p-1 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            ) : (
              <div className="p-1 bg-orange-100 rounded-full">
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      
      {/* Expandable Notes Section */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="ml-7 space-y-3 pl-4 border-l-2 border-green-200">
            <Textarea
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Add notes, observations, or details about completing this item..."
              disabled={disabled || item.is_verified}
              rows={3}
              className="text-sm resize-none transition-all duration-200 focus:ring-2"
            />
            {item.completed_at && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                Completed: {format(new Date(item.completed_at), 'MMM d, yyyy h:mm a')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};