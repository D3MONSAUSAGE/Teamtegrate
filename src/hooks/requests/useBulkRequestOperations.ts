import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export interface BulkOperation {
  type: 'approve' | 'reject' | 'reassign' | 'update_priority' | 'add_comment';
  requestIds: string[];
  data?: any;
}

export const useBulkRequestOperations = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const executeBulkOperation = async (operation: BulkOperation) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const requestId of operation.requestIds) {
        try {
          switch (operation.type) {
            case 'approve':
              await supabase
                .from('requests')
                .update({ status: 'approved' })
                .eq('id', requestId);
              break;

            case 'reject':
              await supabase
                .from('requests')
                .update({ status: 'rejected' })
                .eq('id', requestId);
              break;

            case 'update_priority':
              await supabase
                .from('requests')
                .update({ priority: operation.data.priority })
                .eq('id', requestId);
              break;

            case 'reassign':
              // TODO: Implement reassignment logic when assignment system is ready
              break;

            case 'add_comment':
              await supabase
                .from('request_comments')
                .insert({
                  request_id: requestId,
                  user_id: user.id,
                  content: operation.data.comment,
                  is_internal: operation.data.isInternal || false,
                  organization_id: user.organizationId,
                });
              break;

            default:
              throw new Error(`Unknown operation type: ${operation.type}`);
          }
          successCount++;
        } catch (error) {
          console.error(`Error processing request ${requestId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} request(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to process ${errorCount} request(s)`);
      }

    } catch (error) {
      console.error('Bulk operation error:', error);
      toast.error('Failed to execute bulk operation');
    } finally {
      setLoading(false);
    }

    return { successCount, errorCount };
  };

  const validateBulkOperation = (operation: BulkOperation): string | null => {
    if (!operation.requestIds.length) {
      return 'No requests selected';
    }

    if (operation.requestIds.length > 50) {
      return 'Too many requests selected (max 50)';
    }

    switch (operation.type) {
      case 'add_comment':
        if (!operation.data?.comment?.trim()) {
          return 'Comment text is required';
        }
        break;
      case 'update_priority':
        if (!operation.data?.priority) {
          return 'Priority is required';
        }
        break;
      case 'reassign':
        if (!operation.data?.assigneeId) {
          return 'Assignee is required';
        }
        break;
    }

    return null;
  };

  const canPerformBulkOperation = (operationType: BulkOperation['type']): boolean => {
    if (!user) return false;

    const managerRoles = ['manager', 'admin', 'superadmin'];
    const isManager = managerRoles.includes(user.role);

    switch (operationType) {
      case 'approve':
      case 'reject':
      case 'reassign':
        return isManager;
      case 'update_priority':
      case 'add_comment':
        return true; // All users can update priority and add comments
      default:
        return false;
    }
  };

  return {
    loading,
    executeBulkOperation,
    validateBulkOperation,
    canPerformBulkOperation,
  };
};