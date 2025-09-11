import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checklist, ChecklistFormData } from '@/types/checklist';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useChecklists = () => {
  return useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Checklist[];
    },
  });
};

export const useChecklistItems = (checklistId: string) => {
  return useQuery({
    queryKey: ['checklist-items', checklistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('order_index');

      if (error) throw error;
      return data;
    },
    enabled: !!checklistId,
  });
};

export const useCreateChecklist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ChecklistFormData) => {
      if (!user) throw new Error('User not authenticated');

      // Create checklist
      const { data: checklist, error: checklistError } = await supabase
        .from('checklists')
        .insert({
          name: data.name,
          description: data.description,
          priority: data.priority,
          assignment_type: data.assignment_type,
          execution_window_start: data.execution_window_start || null,
          execution_window_end: data.execution_window_end || null,
          cutoff_time: data.cutoff_time || null,
          branch_area: data.branch_area || null,
          shift_type: data.shift_type || null,
          verification_required: data.verification_required,
          scoring_enabled: data.scoring_enabled,
          scheduled_days: data.scheduled_days,
          created_by: user.id,
          organization_id: user.organizationId,
          status: 'active'
        })
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Create checklist items
      if (data.items.length > 0) {
        const items = data.items.map((item, index) => ({
          checklist_id: checklist.id,
          organization_id: user.organizationId,
          title: item.title,
          description: item.description || null,
          order_index: index,
          is_required: item.is_required,
          verification_required: item.verification_required,
        }));

        const { error: itemsError } = await supabase
          .from('checklist_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Create assignments
      if (data.assignments.length > 0) {
        const assignments = data.assignments.map(assignment => ({
          checklist_id: checklist.id,
          organization_id: user.organizationId,
          assigned_to_user_id: assignment.type === 'user' ? assignment.id : null,
          assigned_to_team_id: assignment.type === 'team' ? assignment.id : null,
          assigned_role: assignment.type === 'role' ? assignment.id : null,
          created_by: user.id,
        }));

        const { error: assignmentsError } = await supabase
          .from('checklist_assignments')
          .insert(assignments);

        if (assignmentsError) throw assignmentsError;
      }

      return checklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: "Success",
        description: "Checklist created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating checklist:', error);
      toast({
        title: "Error",
        description: "Failed to create checklist",
        variant: "destructive",
      });
    },
  });
};

export const useChecklist = (id: string) => {
  return useQuery({
    queryKey: ['checklist', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklists')
        .select(`
          *,
          checklist_items(*),
          checklist_assignments(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useUpdateChecklist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ChecklistFormData }) => {
      if (!user) throw new Error('User not authenticated');

      // Update checklist
      const { data: checklist, error: checklistError } = await supabase
        .from('checklists')
        .update({
          name: data.name,
          description: data.description,
          priority: data.priority,
          assignment_type: data.assignment_type,
          execution_window_start: data.execution_window_start || null,
          execution_window_end: data.execution_window_end || null,
          cutoff_time: data.cutoff_time || null,
          branch_area: data.branch_area || null,
          shift_type: data.shift_type || null,
          verification_required: data.verification_required,
          scoring_enabled: data.scoring_enabled,
          scheduled_days: data.scheduled_days,
        })
        .eq('id', id)
        .select()
        .single();

      if (checklistError) throw checklistError;

      // Delete existing items and assignments
      await supabase.from('checklist_items').delete().eq('checklist_id', id);
      await supabase.from('checklist_assignments').delete().eq('checklist_id', id);

      // Create new items
      if (data.items.length > 0) {
        const items = data.items.map((item, index) => ({
          checklist_id: id,
          organization_id: user.organizationId,
          title: item.title,
          description: item.description || null,
          order_index: index,
          is_required: item.is_required,
          verification_required: item.verification_required,
        }));

        const { error: itemsError } = await supabase
          .from('checklist_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Create new assignments
      if (data.assignments.length > 0) {
        const assignments = data.assignments.map(assignment => ({
          checklist_id: id,
          organization_id: user.organizationId,
          assigned_to_user_id: assignment.type === 'user' ? assignment.id : null,
          assigned_to_team_id: assignment.type === 'team' ? assignment.id : null,
          assigned_role: assignment.type === 'role' ? assignment.id : null,
          created_by: user.id,
        }));

        const { error: assignmentsError } = await supabase
          .from('checklist_assignments')
          .insert(assignments);

        if (assignmentsError) throw assignmentsError;
      }

      return checklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: "Success",
        description: "Checklist updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating checklist:', error);
      toast({
        title: "Error",
        description: "Failed to update checklist",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: "Success",
        description: "Checklist deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting checklist:', error);
      toast({
        title: "Error",
        description: "Failed to delete checklist",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateChecklistStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'active' | 'inactive' | 'archived' }) => {
      const { data, error } = await supabase
        .from('checklists')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast({
        title: "Success",
        description: "Checklist status updated",
      });
    },
    onError: (error) => {
      console.error('Error updating checklist:', error);
      toast({
        title: "Error",
        description: "Failed to update checklist status",
        variant: "destructive",
      });
    },
  });
};