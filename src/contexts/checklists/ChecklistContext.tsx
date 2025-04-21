
import React, { createContext, useContext } from 'react';
import { ChecklistContextType } from './types';

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
});

export const useChecklists = () => useContext(ChecklistContext);
