import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { ChecklistFrequency, ChecklistTemplate, ChecklistItemStatus, ChecklistSection } from '@/types/checklist';
import { useChecklists } from '@/contexts/checklists/ChecklistContext';
import { prepareJsonSections } from '@/contexts/checklists/helpers';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import ChecklistBasicInfo from './ChecklistBasicInfo';
import ChecklistSectionsEditor from './ChecklistSectionsEditor';
import ChecklistBranchSelector from './ChecklistBranchSelector';
import ExecutionWindowOptions from "./ExecutionWindowOptions";

interface CreateChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate?: ChecklistTemplate;
}

const CreateChecklistDialog: React.FC<CreateChecklistDialogProps> = ({
  open,
  onOpenChange,
  editingTemplate
}) => {
  const { addTemplate, addChecklist, checklists, templates } = useChecklists();
  const [activeTab, setActiveTab] = useState('info');
  const [title, setTitle] = useState(editingTemplate?.title || '');
  const [description, setDescription] = useState(editingTemplate?.description || '');
  const [isTemplate, setIsTemplate] = useState(true);
  const [frequency, setFrequency] = useState<ChecklistFrequency>(editingTemplate?.frequency ?? 'once');
  const [sections, setSections] = useState<ChecklistSection[]>(
    editingTemplate?.sections
      ? JSON.parse(JSON.stringify(editingTemplate.sections))
      : [{
          id: '1',
          title: 'Section 1',
          items: [
            { id: '1', text: 'Checklist item 1', status: 'pending' as ChecklistItemStatus, requiredPhoto: false }
          ]
        }]
  );
  const [branches, setBranches] = useState<string[]>(
    editingTemplate?.branchOptions && Array.isArray(editingTemplate.branchOptions)
      ? [...editingTemplate.branchOptions]
      : ['Main Branch']
  );
  const [newBranch, setNewBranch] = useState('');
  const [selectedBranchDropdown, setSelectedBranchDropdown] = useState<string>('');
  const [enableExecutionWindow, setEnableExecutionWindow] = useState(false);
  const [executionStartDate, setExecutionStartDate] = useState<Date | null>(new Date());
  const [executionEndDate, setExecutionEndDate] = useState<Date | null>(null);
  const [executionStartTime, setExecutionStartTime] = useState<string>('08:00');
  const [executionEndTime, setExecutionEndTime] = useState<string>('18:00');

  useEffect(() => {
    if (editingTemplate) {
      setTitle(editingTemplate.title || '');
      setDescription(editingTemplate.description || '');
      setIsTemplate(true);
      setFrequency(editingTemplate.frequency ?? 'once');
      setSections(editingTemplate.sections ? JSON.parse(JSON.stringify(editingTemplate.sections)) : [{
        id: '1',
        title: 'Section 1',
        items: [
          { id: '1', text: 'Checklist item 1', status: 'pending' as ChecklistItemStatus, requiredPhoto: false }
        ]
      }]);
      setBranches(
        editingTemplate.branchOptions && Array.isArray(editingTemplate.branchOptions)
          ? [...editingTemplate.branchOptions]
          : ['Main Branch']
      );
    } else {
      setTitle('');
      setDescription('');
      setIsTemplate(true);
      setFrequency('once');
      setSections([{
        id: '1',
        title: 'Section 1',
        items: [
          { id: '1', text: 'Checklist item 1', status: 'pending' as ChecklistItemStatus, requiredPhoto: false }
        ]
      }]);
      setBranches(['Main Branch']);
    }
    setNewBranch('');
    setSelectedBranchDropdown('');
  }, [editingTemplate, open]);

  const allBranches = useMemo(() => {
    const branchSet = new Set<string>();
    checklists.forEach((cl) => {
      if (cl.branch) branchSet.add(cl.branch);
    });
    templates.forEach((tpl) => {
      if (tpl.branchOptions && Array.isArray(tpl.branchOptions)) {
        tpl.branchOptions.forEach((b: string) => branchSet.add(b));
      }
    });
    return Array.from(branchSet).filter(
      (b) => !branches.includes(b)
    );
  }, [checklists, templates, branches]);

  const handleAddSection = () => {
    setSections([...sections, {
      id: Date.now().toString(),
      title: `Section ${sections.length + 1}`,
      items: []
    }]);
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter(section => section.id !== sectionId));
  };

  const handleUpdateSectionTitle = (sectionId: string, title: string) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, title } : section
    ));
  };

  const handleAddItem = (sectionId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...section.items, {
            id: Date.now().toString(),
            text: '',
            status: 'pending' as ChecklistItemStatus,
            requiredPhoto: false
          }]
        };
      }
      return section;
    }));
  };

  const handleRemoveItem = (sectionId: string, itemId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.filter(item => item.id !== itemId)
        };
      }
      return section;
    }));
  };

  const handleUpdateItemText = (sectionId: string, itemId: string, text: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item =>
            item.id === itemId ? { ...item, text } : item
          )
        };
      }
      return section;
    }));
  };

  const handleToggleRequirePhoto = (sectionId: string, itemId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item =>
            item.id === itemId ? { ...item, requiredPhoto: !item.requiredPhoto } : item
          )
        };
      }
      return section;
    }));
  };

  const handleAddBranch = () => {
    const trimmed = newBranch.trim();
    if (trimmed && !branches.includes(trimmed)) {
      setBranches([...branches, trimmed]);
      setNewBranch('');
    }
  };

  const handleAddBranchFromDropdown = (value: string) => {
    if (value && !branches.includes(value)) {
      setBranches([...branches, value]);
    }
    setSelectedBranchDropdown('');
  };

  const handleRemoveBranch = (branch: string) => {
    setBranches(branches.filter(b => b !== branch));
  };

  const handleSave = async () => {
    if (!title) {
      toast.error('Please enter a title');
      return;
    }

    const emptySection = sections.find(section => !section.title.trim());
    if (emptySection) {
      toast.error('All sections must have titles');
      return;
    }

    let hasEmptyItem = false;
    sections.forEach(section => {
      section.items.forEach(item => {
        if (!item.text.trim()) hasEmptyItem = true;
      });
    });

    if (hasEmptyItem) {
      toast.error('All checklist items must have text');
      return;
    }

    try {
      if (isTemplate) {
        if (editingTemplate) {
          const { supabase } = await import('@/integrations/supabase/client');
          
          const preparedSections = prepareJsonSections(sections);
          
          const { error } = await supabase
            .from('checklist_templates')
            .update({
              title: title,
              description: description,
              sections: preparedSections,
              frequency: frequency,
              branch_options: branches
            })
            .eq('id', editingTemplate.id);
          
          if (error) throw error;
          toast.success('Template updated successfully');
        } else {
          await addTemplate({
            title,
            description,
            sections,
            frequency,
            branchOptions: branches
          });
          toast.success('Template saved successfully');
        }
      } else {
        let executionWindow = undefined;
        if (enableExecutionWindow) {
          executionWindow = {
            startDate: executionStartDate,
            endDate: executionEndDate,
            startTime: executionStartTime,
            endTime: executionEndTime,
          };
        }
        await addChecklist({
          title,
          description,
          sections,
          branch: branches.length > 0 ? branches[0] : undefined,
          startDate: new Date(),
          status: 'draft',
          executionWindow,
        });
        toast.success('Checklist created successfully');
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred while saving. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? 'Edit Checklist Template' : 'Create New Checklist'}
          </DialogTitle>
          <DialogDescription>
            {isTemplate
              ? 'Create a reusable template for recurring checklists.'
              : 'Create a new checklist from scratch or a template.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Basic Info</TabsTrigger>
            <TabsTrigger value="items">Checklist Items</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 py-4">
            <ChecklistBasicInfo
              title={title}
              description={description}
              isTemplate={isTemplate}
              frequency={frequency}
              onChangeTitle={setTitle}
              onChangeDescription={setDescription}
              onChangeIsTemplate={setIsTemplate}
              onChangeFrequency={setFrequency}
              onContinue={() => setActiveTab('items')}
            />
          </TabsContent>

          <TabsContent value="items" className="space-y-4 py-4">
            <ChecklistSectionsEditor
              sections={sections}
              onAddSection={handleAddSection}
              onRemoveSection={handleRemoveSection}
              onUpdateSectionTitle={handleUpdateSectionTitle}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onUpdateItemText={handleUpdateItemText}
              onToggleRequirePhoto={handleToggleRequirePhoto}
              onBack={() => setActiveTab('info')}
              onContinue={() => setActiveTab('options')}
            />
          </TabsContent>

          <TabsContent value="options" className="space-y-4 py-4">
            <ChecklistBranchSelector
              branches={branches}
              allBranches={allBranches}
              selectedBranchDropdown={selectedBranchDropdown}
              newBranch={newBranch}
              onAddBranch={handleAddBranch}
              onAddBranchFromDropdown={handleAddBranchFromDropdown}
              onRemoveBranch={handleRemoveBranch}
              onChangeNewBranch={setNewBranch}
              onChangeDropdown={setSelectedBranchDropdown}
            />

            {!isTemplate && (
              <ExecutionWindowOptions
                enableExecutionWindow={enableExecutionWindow}
                setEnableExecutionWindow={setEnableExecutionWindow}
                executionStartDate={executionStartDate}
                setExecutionStartDate={setExecutionStartDate}
                executionEndDate={executionEndDate}
                setExecutionEndDate={setExecutionEndDate}
                executionStartTime={executionStartTime}
                setExecutionStartTime={setExecutionStartTime}
                executionEndTime={executionEndTime}
                setExecutionEndTime={setExecutionEndTime}
              />
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            {isTemplate ? 'Save Template' : 'Create Checklist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChecklistDialog;
