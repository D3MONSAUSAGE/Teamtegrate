import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Check, 
  X, 
  MessageSquare, 
  AlertTriangle,
  Users
} from 'lucide-react';
import { useBulkRequestOperations, BulkOperation } from '@/hooks/requests/useBulkRequestOperations';
import { Request } from '@/types/requests';

interface BulkRequestActionsProps {
  selectedRequests: Request[];
  onOperationComplete: () => void;
}

export const BulkRequestActions: React.FC<BulkRequestActionsProps> = ({
  selectedRequests,
  onOperationComplete,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState<BulkOperation['type'] | null>(null);
  const [comment, setComment] = useState('');
  const [priority, setPriority] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  
  const { 
    loading, 
    executeBulkOperation, 
    validateBulkOperation, 
    canPerformBulkOperation 
  } = useBulkRequestOperations();

  const handleOperation = async (type: BulkOperation['type'], data?: any) => {
    const operation: BulkOperation = {
      type,
      requestIds: selectedRequests.map(r => r.id),
      data,
    };

    const validationError = validateBulkOperation(operation);
    if (validationError) {
      alert(validationError);
      return;
    }

    const result = await executeBulkOperation(operation);
    if (result.successCount > 0) {
      onOperationComplete();
      setDialogOpen(false);
      setComment('');
      setPriority('');
      setOperationType(null);
    }
  };

  const openDialog = (type: BulkOperation['type']) => {
    setOperationType(type);
    setDialogOpen(true);
  };

  const renderDialogContent = () => {
    switch (operationType) {
      case 'add_comment':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comment..."
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="internal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              <Label htmlFor="internal">Internal comment (not visible to requesters)</Label>
            </div>
            <Button 
              onClick={() => handleOperation('add_comment', { comment, isInternal })}
              disabled={!comment.trim() || loading}
              className="w-full"
            >
              Add Comment to {selectedRequests.length} Request(s)
            </Button>
          </div>
        );

      case 'update_priority':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="priority">New Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => handleOperation('update_priority', { priority })}
              disabled={!priority || loading}
              className="w-full"
            >
              Update Priority for {selectedRequests.length} Request(s)
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedRequests.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
      <Badge variant="secondary" className="gap-1">
        <Users className="w-3 h-3" />
        {selectedRequests.length} selected
      </Badge>

      <div className="flex gap-2">
        {canPerformBulkOperation('approve') && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOperation('approve')}
            disabled={loading}
            className="gap-1"
          >
            <Check className="w-3 h-3" />
            Approve All
          </Button>
        )}

        {canPerformBulkOperation('reject') && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOperation('reject')}
            disabled={loading}
            className="gap-1"
          >
            <X className="w-3 h-3" />
            Reject All
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              More Actions
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => openDialog('add_comment')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Comment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog('update_priority')}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Update Priority
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {operationType === 'add_comment' && 'Add Comment to Requests'}
              {operationType === 'update_priority' && 'Update Request Priority'}
            </DialogTitle>
          </DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};