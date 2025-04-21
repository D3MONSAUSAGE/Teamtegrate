
// ChecklistProvider implementation manages checklist state & logic.
// It uses ChecklistContext from ChecklistContext.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Checklist, ChecklistTemplate, ExecutionWindow } from '@/types/checklist';
import { useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ChecklistContext } from './ChecklistContext';
import { ChecklistContextType } from './types';
import { 
  prepareJsonSections, 
  processStoredSections,
  validateChecklistStatus,
  validateChecklistFrequency,
  isWithinExecutionWindow
} from './helpers';

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch checklist templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const processedTemplates = data.map((template) => ({
          id: template.id,
          title: template.title,
          description: template.description || '',
          sections: processStoredSections(template.sections),
          createdBy: template.created_by || '',
          createdAt: template.created_at ? new Date(template.created_at) : new Date(),
          branchOptions: template.branch_options || [],
          frequency: validateChecklistFrequency(template.frequency || 'once'),
          lastGenerated: template.last_generated ? new Date(template.last_generated) : undefined,
          tags: template.tags || [],
        }));
        setTemplates(processedTemplates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load checklist templates');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch checklists
  const fetchChecklists = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const processedChecklists = data.map((checklist) => {
          // Create execution window if it exists in database
          let executionWindow: ExecutionWindow | undefined = undefined;
          const checklistAny = checklist as any;
          if (checklistAny.execution_window) {
            executionWindow = {
              startDate: checklistAny.execution_window.start_date ? new Date(checklistAny.execution_window.start_date) : null,
              endDate: checklistAny.execution_window.end_date ? new Date(checklistAny.execution_window.end_date) : null,
              startTime: checklistAny.execution_window.start_time,
              endTime: checklistAny.execution_window.end_time,
            };
          }
          
          return {
            id: checklist.id,
            title: checklist.title,
            description: checklist.description || '',
            sections: processStoredSections(checklist.sections),
            createdBy: checklist.created_by || '',
            createdAt: checklist.created_at ? new Date(checklist.created_at) : new Date(),
            assignedTo: checklist.assigned_to || [],
            startDate: checklist.start_date ? new Date(checklist.start_date) : new Date(),
            dueDate: checklist.due_date ? new Date(checklist.due_date) : undefined,
            status: validateChecklistStatus(checklist.status),
            progress: typeof checklist.progress === 'number' ? checklist.progress : 0,
            completedCount: typeof checklist.completed_count === 'number' ? checklist.completed_count : 0,
            totalCount: typeof checklist.total_count === 'number' ? checklist.total_count : 0,
            templateId: checklist.template_id || undefined,
            branch: checklist.branch || undefined,
            executionWindow,
          };
        });
        setChecklists(processedChecklists);
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
      toast.error('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  }, []);

  const addChecklist = async (newChecklist: Partial<Checklist>) => {
    if (!user) {
      toast.error('You must be logged in to create a checklist');
      throw new Error('User not authenticated');
    }
    try {
      const sections = (newChecklist.sections || []);
      const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
      const executionWindow = newChecklist.executionWindow ? {
        start_date: newChecklist.executionWindow.startDate?.toISOString(),
        end_date: newChecklist.executionWindow.endDate?.toISOString(),
        start_time: newChecklist.executionWindow.startTime,
        end_time: newChecklist.executionWindow.endTime,
      } : null;
      const insertData = {
        title: newChecklist.title || 'New Checklist',
        description: newChecklist.description || '',
        sections: prepareJsonSections(sections),
        created_by: user.id,
        assigned_to: newChecklist.assignedTo || [user.id],
        start_date: (newChecklist.startDate || new Date()).toISOString(),
        status: newChecklist.status || 'draft',
        total_count: totalItems,
        completed_count: 0,
        progress: 0,
        branch: newChecklist.branch || null,
        template_id: newChecklist.templateId || null,
        due_date: newChecklist.dueDate ? newChecklist.dueDate.toISOString() : null,
        execution_window: executionWindow,
      };
      const { error } = await supabase.from('checklists').insert([insertData]);
      if (error) throw error;
      toast.success('Checklist created successfully');
      await fetchChecklists();
    } catch (error) {
      console.error('Error creating checklist:', error);
      toast.error('Failed to create checklist');
      throw error;
    }
  };

  const addTemplate = async (newTemplate: Partial<ChecklistTemplate>) => {
    if (!user) {
      toast.error('You must be logged in to create a template');
      throw new Error('User not authenticated');
    }
    try {
      const sections = (newTemplate.sections || []);
      const insertData = {
        title: newTemplate.title || 'New Template',
        description: newTemplate.description || '',
        sections: prepareJsonSections(sections),
        created_by: user.id,
        frequency: newTemplate.frequency ? validateChecklistFrequency(newTemplate.frequency) : 'once',
        branch_options: newTemplate.branchOptions || [],
        tags: newTemplate.tags || [],
        last_generated: newTemplate.lastGenerated ? newTemplate.lastGenerated.toISOString() : null,
      };
      const { error } = await supabase.from('checklist_templates').insert([insertData]);
      if (error) throw error;
      toast.success('Template created successfully');
      await fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
      throw error;
    }
  };

  // Check if a checklist can be executed based on its execution window
  const canExecuteChecklist = (checklist: Checklist): boolean => {
    if (!checklist.executionWindow) return true;
    return isWithinExecutionWindow(checklist.executionWindow);
  };

  const getTemplateById = (id: string) => templates.find(template => template.id === id);

  const getChecklistById = (id: string) => checklists.find(checklist => checklist.id === id);

  useEffect(() => {
    fetchTemplates();
    fetchChecklists();
  }, [fetchTemplates, fetchChecklists]);

  const contextValue: ChecklistContextType = {
    checklists,
    templates,
    loading,
    addChecklist,
    addTemplate,
    getTemplateById,
    getChecklistById,
    fetchChecklists,
    fetchTemplates,
    canExecuteChecklist,
  };

  return (
    <ChecklistContext.Provider value={contextValue}>
      {children}
    </ChecklistContext.Provider>
  );
};

