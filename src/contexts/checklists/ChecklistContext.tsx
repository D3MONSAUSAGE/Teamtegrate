
import React, { createContext, useContext } from 'react';
import { ChecklistContextType } from './types';

// Dedicated context for checklists, avoiding in-file implementation logic
export const ChecklistContext = createContext<ChecklistContextType>({
  checklists: [],
  templates: [],
  loading: false,
  addChecklist: async () => {},
  addTemplate: async () => {},
  getTemplateById: () => undefined,
  getChecklistById: () => undefined,
  fetchChecklists: async () => {},
  fetchTemplates: async () => {},
  canExecuteChecklist: () => true,
});

// Standard hook to use the checklist context
export const useChecklists = () => useContext(ChecklistContext);

