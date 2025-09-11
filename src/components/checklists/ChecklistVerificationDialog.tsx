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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChecklistExecution } from '@/types/checklist';
import {
  useChecklistExecutionItems,
  useVerifyChecklistItem,
  useVerifyChecklistExecution,
} from '@/hooks/useChecklistExecutions';
import { ShieldCheck, CheckCircle, AlertCircle, FileText, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ChecklistVerificationDialogProps {
  execution: ChecklistExecution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChecklistVerificationDialog: React.FC<ChecklistVerificationDialogProps> = ({
  execution,
  open,
  onOpenChange,
}) => {
  const [verificationScore, setVerificationScore] = useState(100);
  const [overallNotes, setOverallNotes] = useState('');
  const { toast } = useToast();
  
  const { data: items, isLoading } = useChecklistExecutionItems(execution?.id || '');
  const verifyItem = useVerifyChecklistItem();
  const verifyExecution = useVerifyChecklistExecution();

  useEffect(() => {
    if (execution) {
      setVerificationScore(execution.execution_score || 100);
      setOverallNotes('');
    }
  }, [execution]);

  const handleVerifyItem = async (itemId: string, isVerified: boolean, notes?: string) => {
    try {
      await verifyItem.mutateAsync({
        itemId,
        isVerified,
        notes,
      });
      toast({
        title: isVerified ? "Item Verified" : "Item Unverified",
        description: "Item verification status updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item verification status.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteVerification = async () => {
    if (!execution) return;

    try {
      await verifyExecution.mutateAsync({
        executionId: execution.id,
        verificationScore: verificationScore,
        notes: overallNotes,
      });
      
      toast({
        title: "Verification Complete",
        description: "Checklist has been verified successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete verification.",
        variant: "destructive",
      });
    }
  };

  const verifiedItemsCount = items?.filter(item => item.is_verified).length || 0;
  const totalItemsCount = items?.length || 0;
  const allItemsVerified = verifiedItemsCount === totalItemsCount && totalItemsCount > 0;

  if (!execution) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verify: {execution.checklist?.name}
            <Badge variant="outline">
              {format(new Date(execution.execution_date), 'MMM d, yyyy')}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review and verify each checklist item completed by {execution.assigned_user?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              {/* Execution Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Employee:</span>
                  <span>{execution.assigned_user?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Completed:</span>
                  <span>{format(new Date(execution.completed_at!), 'MMM d, yyyy h:mm a')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Execution Score:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {execution.execution_score}/100
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Verification Progress:</span>
                  <span className="text-sm">
                    {verifiedItemsCount}/{totalItemsCount} items verified
                  </span>
                </div>
              </div>

              {/* Employee Notes */}
              {execution.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Employee Notes:</h4>
                  <p className="text-sm text-blue-800">{execution.notes}</p>
                </div>
              )}

              {/* Verification Items */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Verification Items
                  </h3>
                  
                  <div className="space-y-3">
                    {items?.map((item, index) => (
                      <VerificationItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        onVerify={handleVerifyItem}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Overall Verification */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Overall Verification
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="verification-score">Verification Score (0-100)</Label>
                    <Input
                      id="verification-score"
                      type="number"
                      min="0"
                      max="100"
                      value={verificationScore}
                      onChange={(e) => setVerificationScore(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overall-notes">Verification Notes</Label>
                  <Textarea
                    id="overall-notes"
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    placeholder="Add any notes about the overall verification..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Complete Verification Button */}
              <Button
                onClick={handleCompleteVerification}
                className="w-full"
                disabled={!allItemsVerified || verifyExecution.isPending}
              >
                {verifyExecution.isPending ? 'Completing Verification...' : 'Complete Verification'}
              </Button>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface VerificationItemCardProps {
  item: any;
  index: number;
  onVerify: (itemId: string, isVerified: boolean, notes?: string) => void;
}

const VerificationItemCard: React.FC<VerificationItemCardProps> = ({
  item,
  index,
  onVerify,
}) => {
  const [verificationNotes, setVerificationNotes] = useState(item.verification_notes || '');

  const handleVerifyChange = (checked: boolean) => {
    onVerify(item.id, checked, verificationNotes);
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 mt-1">
          {item.is_completed ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-500" />
          )}
          <Checkbox
            checked={item.is_verified}
            onCheckedChange={handleVerifyChange}
            className="mt-0"
          />
        </div>
        
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

          {/* Employee completion notes */}
          {item.notes && (
            <div className="bg-gray-50 rounded p-2 mt-2">
              <p className="text-xs text-gray-600 mb-1">Employee notes:</p>
              <p className="text-sm">{item.notes}</p>
            </div>
          )}

          {/* Completion timestamp */}
          {item.completed_at && (
            <p className="text-xs text-muted-foreground">
              Completed: {format(new Date(item.completed_at), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>
      </div>

      {/* Verification Notes */}
      <div className="ml-8 space-y-2">
        <Label htmlFor={`verification-notes-${item.id}`} className="text-xs">
          Verification Notes
        </Label>
        <Textarea
          id={`verification-notes-${item.id}`}
          value={verificationNotes}
          onChange={(e) => setVerificationNotes(e.target.value)}
          placeholder="Add verification notes for this item..."
          rows={2}
          className="text-sm"
        />
      </div>
    </div>
  );
};