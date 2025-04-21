
import React, { createContext, useContext, useState } from 'react';
import { Checklist, ChecklistTemplate } from '@/types/checklist';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../AuthContext';

interface ChecklistContextType {
  checklists: Checklist[];
  templates: ChecklistTemplate[];
  addChecklist: (checklist: Partial<Checklist>) => void;
  addTemplate: (template: Partial<ChecklistTemplate>) => void;
  getTemplateById: (id: string) => ChecklistTemplate | undefined;
  getChecklistById: (id: string) => Checklist | undefined;
}

// Initial mock data
const initialTemplates: ChecklistTemplate[] = [
  {
    id: '1',
    title: 'Store Opening Template',
    description: 'Template for daily store opening procedures',
    sections: [
      {
        id: 's1',
        title: 'Security',
        items: [
          { id: 'i1', text: 'Disarm security system', status: 'pending' },
          { id: 'i2', text: 'Check all emergency exits', status: 'pending' },
          { id: 'i3', text: 'Test alarm system', status: 'pending' },
        ]
      },
      {
        id: 's2',
        title: 'Preparation',
        items: [
          { id: 'i4', text: 'Turn on all lights', status: 'pending' },
          { id: 'i5', text: 'Count starting cash', status: 'pending' },
          { id: 'i6', text: 'Prepare POS system', status: 'pending' },
        ]
      }
    ],
    createdBy: 'user-1',
    createdAt: new Date('2025-03-15'),
    branchOptions: ['Main Street Branch', 'Downtown Branch', 'Mall Location'],
    frequency: 'daily'
  },
  {
    id: '2',
    title: 'Weekly Equipment Inspection',
    description: 'Template for safety checks of all store equipment',
    sections: [
      {
        id: 's1',
        title: 'Safety Equipment',
        items: [
          { id: 'i1', text: 'Check fire extinguishers', status: 'pending' },
          { id: 'i2', text: 'Inspect first aid kits', status: 'pending' },
          { id: 'i3', text: 'Test emergency lighting', status: 'pending', requiredPhoto: true },
        ]
      },
      {
        id: 's2',
        title: 'Operations Equipment',
        items: [
          { id: 'i4', text: 'Check refrigeration units', status: 'pending' },
          { id: 'i5', text: 'Inspect POS terminals', status: 'pending' },
          { id: 'i6', text: 'Test backup power', status: 'pending', requiredPhoto: true },
        ]
      }
    ],
    createdBy: 'user-1',
    createdAt: new Date('2025-03-20'),
    branchOptions: ['Main Street Branch', 'Downtown Branch', 'Mall Location'],
    frequency: 'weekly'
  }
];

const initialChecklists: Checklist[] = [
  {
    id: '1',
    title: 'Store Opening Procedure',
    description: 'Daily checklist for opening the store',
    sections: [
      {
        id: 's1',
        title: 'Security',
        items: [
          { id: 'i1', text: 'Disarm security system', status: 'completed' },
          { id: 'i2', text: 'Check all emergency exits', status: 'completed' },
          { id: 'i3', text: 'Test alarm system', status: 'pending' },
        ]
      },
      {
        id: 's2',
        title: 'Preparation',
        items: [
          { id: 'i4', text: 'Turn on all lights', status: 'completed' },
          { id: 'i5', text: 'Count starting cash', status: 'pending' },
          { id: 'i6', text: 'Prepare POS system', status: 'pending' },
        ]
      }
    ],
    createdBy: 'user-1',
    createdAt: new Date('2025-04-19'),
    assignedTo: ['user-1', 'user-2'],
    startDate: new Date('2025-04-20'),
    dueDate: new Date('2025-04-20'),
    status: 'in-progress',
    progress: 50,
    completedCount: 3,
    totalCount: 6,
    branch: 'Main Street Branch'
  },
  {
    id: '2',
    title: 'Weekly Equipment Inspection',
    description: 'Safety check of all equipment',
    sections: [
      {
        id: 's1',
        title: 'Safety Equipment',
        items: [
          { id: 'i1', text: 'Check fire extinguishers', status: 'completed' },
          { id: 'i2', text: 'Inspect first aid kits', status: 'completed' },
          { id: 'i3', text: 'Test emergency lighting', status: 'completed' },
        ]
      },
      {
        id: 's2',
        title: 'Operations Equipment',
        items: [
          { id: 'i4', text: 'Check refrigeration units', status: 'completed' },
          { id: 'i5', text: 'Inspect POS terminals', status: 'completed' },
          { id: 'i6', text: 'Test backup power', status: 'completed' },
        ]
      }
    ],
    createdBy: 'user-1',
    createdAt: new Date('2025-04-15'),
    assignedTo: ['user-3'],
    startDate: new Date('2025-04-18'),
    dueDate: new Date('2025-04-19'),
    status: 'completed',
    progress: 100,
    completedCount: 6,
    totalCount: 6,
    branch: 'Downtown Branch'
  }
];

export const ChecklistContext = createContext<ChecklistContextType>({
  checklists: [],
  templates: [],
  addChecklist: () => {},
  addTemplate: () => {},
  getTemplateById: () => undefined,
  getChecklistById: () => undefined,
});

export const useChecklists = () => useContext(ChecklistContext);

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checklists, setChecklists] = useState<Checklist[]>(initialChecklists);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(initialTemplates);
  const { user } = useAuth();
  
  const addChecklist = (newChecklist: Partial<Checklist>) => {
    const now = new Date();
    const totalItems = newChecklist.sections?.reduce(
      (acc, section) => acc + section.items.length, 0
    ) || 0;
    
    const checklist: Checklist = {
      id: newChecklist.id || uuidv4(),
      title: newChecklist.title || 'New Checklist',
      description: newChecklist.description || '',
      sections: newChecklist.sections || [],
      createdBy: user?.id || 'unknown',
      createdAt: now,
      startDate: newChecklist.startDate || now,
      dueDate: newChecklist.dueDate,
      assignedTo: newChecklist.assignedTo || [user?.id || 'unknown'],
      status: newChecklist.status || 'draft',
      progress: 0,
      completedCount: 0,
      totalCount: totalItems,
      templateId: newChecklist.templateId,
      branch: newChecklist.branch
    };
    
    setChecklists(prev => [checklist, ...prev]);
    return checklist;
  };
  
  const addTemplate = (newTemplate: Partial<ChecklistTemplate>) => {
    if (!newTemplate.title) return;
    
    const template: ChecklistTemplate = {
      id: newTemplate.id || uuidv4(),
      title: newTemplate.title,
      description: newTemplate.description || '',
      sections: newTemplate.sections || [],
      createdBy: user?.id || 'unknown',
      createdAt: new Date(),
      branchOptions: newTemplate.branchOptions || [],
      frequency: newTemplate.frequency || 'once',
      lastGenerated: newTemplate.lastGenerated,
      tags: newTemplate.tags || []
    };
    
    setTemplates(prev => [template, ...prev]);
    return template;
  };
  
  const getTemplateById = (id: string) => {
    return templates.find(template => template.id === id);
  };
  
  const getChecklistById = (id: string) => {
    return checklists.find(checklist => checklist.id === id);
  };
  
  return (
    <ChecklistContext.Provider 
      value={{ 
        checklists, 
        templates, 
        addChecklist, 
        addTemplate,
        getTemplateById,
        getChecklistById
      }}
    >
      {children}
    </ChecklistContext.Provider>
  );
};
