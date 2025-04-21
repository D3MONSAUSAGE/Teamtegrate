
import { Checklist, ChecklistTemplate } from '@/types/checklist';

export interface ChecklistContextType {
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
