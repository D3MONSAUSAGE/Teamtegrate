
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Checklist, ChecklistTemplate } from '@/types/checklist';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistContextType {
  checklists: Checklist[];
  templates: ChecklistTemplate[];
  loading: boolean;
  addChecklist: (checklist: Partial<Checklist>) => Promise<void>;
  addTemplate: (template: Partial<ChecklistTemplate>) => Promise<void>;
  getTemplateById: (id: string) => ChecklistTemplate | undefined;
  getChecklistById: (id: string) => Checklist | undefined;
  fetchChecklists: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
}

const ChecklistContext = createContext<ChecklistContextType>({
  checklists: [],
  templates: [],
  loading: false,
  addChecklist: async () => {},
  addTemplate: async () => {},
  getTemplateById: () => undefined,
  getChecklistById: () => undefined,
  fetchChecklists: async () => {},
  fetchTemplates: async () => {},
});

export const useChecklists = () => useContext(ChecklistContext);

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch checklist templates from Supabase
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setTemplates(
        data.map((t) => ({
          ...t,
          id: t.id,
          title: t.title,
          description: t.description || '',
          sections: t.sections || [],
          createdBy: t.created_by || '',
          createdAt: t.created_at ? new Date(t.created_at) : new Date(),
          branchOptions: t.branch_options || [],
          frequency: t.frequency || 'once',
          lastGenerated: t.last_generated ? new Date(t.last_generated) : undefined,
          tags: t.tags || [],
        }))
      );
    }
    setLoading(false);
  }, []);

  // Fetch checklists from Supabase
  const fetchChecklists = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setChecklists(
        data.map((c) => ({
          ...c,
          id: c.id,
          title: c.title,
          description: c.description || '',
          sections: c.sections || [],
          createdBy: c.created_by || '',
          createdAt: c.created_at ? new Date(c.created_at) : new Date(),
          assignedTo: c.assigned_to || [],
          startDate: c.start_date ? new Date(c.start_date) : new Date(),
          dueDate: c.due_date ? new Date(c.due_date) : undefined,
          status: c.status as Checklist['status'],
          progress: typeof c.progress === 'number' ? c.progress : 0,
          completedCount: typeof c.completed_count === 'number' ? c.completed_count : 0,
          totalCount: typeof c.total_count === 'number' ? c.total_count : 0,
          templateId: c.template_id || undefined,
          branch: c.branch || undefined,
        }))
      );
    }
    setLoading(false);
  }, []);

  // Add new checklist to Supabase
  const addChecklist = async (newChecklist: Partial<Checklist>) => {
    if (!user) throw new Error('User not authenticated');
    // Type-safe section/items using correct enums
    // Ensures all items use ChecklistItemStatus type
    const sections = (newChecklist.sections || []).map(section => ({
      ...section,
      items: section.items.map(item => ({
        ...item,
        status: item.status as Checklist['sections'][0]['items'][0]['status'],
      }))
    }));
    const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);

    const insertData = {
      title: newChecklist.title || 'New Checklist',
      description: newChecklist.description || '',
      sections: sections,
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
    };

    const { error } = await supabase.from('checklists').insert([insertData]);
    if (error) throw error;
    await fetchChecklists();
  };

  // Add new template to Supabase
  const addTemplate = async (newTemplate: Partial<ChecklistTemplate>) => {
    if (!user) throw new Error('User not authenticated');
    const sections = (newTemplate.sections || []).map(section => ({
      ...section,
      items: section.items.map(item => ({
        ...item,
        status: item.status as ChecklistTemplate['sections'][0]['items'][0]['status'],
      }))
    }));

    const insertData = {
      title: newTemplate.title || 'New Template',
      description: newTemplate.description || '',
      sections: sections,
      created_by: user.id,
      frequency: newTemplate.frequency || 'once',
      branch_options: newTemplate.branchOptions || [],
      tags: newTemplate.tags || [],
      last_generated: newTemplate.lastGenerated ? newTemplate.lastGenerated.toISOString() : null,
    };

    const { error } = await supabase.from('checklist_templates').insert([insertData]);
    if (error) throw error;
    await fetchTemplates();
  };

  const getTemplateById = (id: string) => {
    return templates.find(template => template.id === id);
  };

  const getChecklistById = (id: string) => {
    return checklists.find(checklist => checklist.id === id);
  };

  // On mount, fetch all checklist data
  useEffect(() => {
    fetchTemplates();
    fetchChecklists();
  }, [fetchTemplates, fetchChecklists]);

  return (
    <ChecklistContext.Provider 
      value={{ 
        checklists, 
        templates, 
        loading,
        addChecklist, 
        addTemplate,
        getTemplateById, 
        getChecklistById,
        fetchChecklists,
        fetchTemplates,
      }}
    >
      {children}
    </ChecklistContext.Provider>
  );
};
