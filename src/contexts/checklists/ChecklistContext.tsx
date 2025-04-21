
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Checklist, ChecklistTemplate, ChecklistSection, ChecklistItem, ChecklistItemStatus, ChecklistFrequency } from '@/types/checklist';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

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

// Helper function to convert Date objects to ISO strings for JSON storage
const prepareJsonSections = (sections: ChecklistSection[]) => {
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      // Convert Date objects to ISO strings for storage
      completedAt: item.completedAt ? item.completedAt.toISOString() : undefined,
    }))
  }));
};

// Helper function to convert ISO strings back to Date objects
const processStoredSections = (sections: any): ChecklistSection[] => {
  if (!sections || !Array.isArray(sections)) return [];
  
  return sections.map(section => ({
    id: section.id,
    title: section.title,
    items: Array.isArray(section.items) ? section.items.map(item => ({
      id: item.id,
      text: item.text,
      status: item.status as ChecklistItemStatus,
      notes: item.notes,
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
      completedBy: item.completedBy,
      requiredPhoto: item.requiredPhoto || false,
      photoUrl: item.photoUrl,
    })) : [],
  }));
};

// Helper function to validate checklist status
const validateChecklistStatus = (status: string): "draft" | "in-progress" | "completed" => {
  if (status === "draft" || status === "in-progress" || status === "completed") {
    return status;
  }
  return "draft"; // Default to draft if invalid status is provided
};

// Helper function to validate checklist frequency
const validateChecklistFrequency = (frequency: string): ChecklistFrequency => {
  if (frequency === "once" || frequency === "daily" || frequency === "weekly" || frequency === "monthly") {
    return frequency as ChecklistFrequency;
  }
  return "once"; // Default to once if invalid frequency is provided
};

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch checklist templates from Supabase
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

  // Fetch checklists from Supabase
  const fetchChecklists = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const processedChecklists = data.map((checklist) => ({
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
        }));
        
        setChecklists(processedChecklists);
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
      toast.error('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new checklist to Supabase
  const addChecklist = async (newChecklist: Partial<Checklist>) => {
    if (!user) {
      toast.error('You must be logged in to create a checklist');
      throw new Error('User not authenticated');
    }
    
    try {
      // Type-safe section/items using correct enums
      // Ensures all items use ChecklistItemStatus type
      const sections = (newChecklist.sections || []);
      const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);

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

  // Add new template to Supabase
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
        frequency: newTemplate.frequency || 'once',
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
