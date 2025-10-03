import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeleteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}

export default function DeleteEmployeeDialog({ open, onOpenChange, employeeId }: DeleteEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { data: employee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', employeeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!employeeId,
  });

  const handleDelete = async () => {
    setLoading(true);

    try {
      // TODO: Implement safe employee deletion with impact analysis
      toast({
        title: 'Feature coming soon',
        description: 'Employee deletion will be available soon with proper safeguards.',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Employee</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>{employee?.name}</strong> ({employee?.email})?
            </p>
            <p className="text-destructive font-medium">
              This action cannot be undone and will:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Remove the employee from all teams</li>
              <li>Unassign all their tasks</li>
              <li>Delete their account permanently</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Employee
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
