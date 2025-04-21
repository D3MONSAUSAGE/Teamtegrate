import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChecklistFrequency, ChecklistTemplate, ChecklistItemStatus } from '@/types/checklist';
import { Plus, Trash2, Move, Check } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useChecklists } from '@/contexts/checklists/ChecklistContext';

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
  const [sections, setSections] = useState(() =>
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
          const updateData = {
            title,
            description,
            sections: sections.map(section => ({
              ...section,
              items: section.items.map(item => ({
                ...item,
                status: item.status as ChecklistItemStatus,
                requiredPhoto: !!item.requiredPhoto,
              }))
            })),
            frequency,
            branchOptions: branches
          };
          const { supabase } = await import('@/integrations/supabase/client');
          const { error } = await supabase
            .from('checklist_templates')
            .update({
              title: updateData.title,
              description: updateData.description,
              sections: updateData.sections,
              frequency: updateData.frequency,
              branch_options: updateData.branchOptions
            })
            .eq('id', editingTemplate.id);
          if (error) throw error;
          toast.success('Template updated successfully');
        } else {
          await addTemplate({
            title,
            description,
            sections: sections.map(section => ({
              ...section,
              items: section.items.map(item => ({
                ...item,
                status: item.status as ChecklistItemStatus,
                requiredPhoto: !!item.requiredPhoto,
              }))
            })),
            frequency,
            branchOptions: branches
          });
          toast.success('Template saved successfully');
        }
      } else {
        await addChecklist({
          title,
          description,
          sections: sections.map(section => ({
            ...section,
            items: section.items.map(item => ({
              ...item,
              status: item.status as ChecklistItemStatus,
              requiredPhoto: !!item.requiredPhoto,
            }))
          })),
          branch: branches.length > 0 ? branches[0] : undefined,
          startDate: new Date(),
          status: 'draft'
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Store Opening Procedure" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this checklist" 
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="template" 
                  checked={isTemplate} 
                  onCheckedChange={setIsTemplate} 
                />
                <Label htmlFor="template">Save as reusable template</Label>
              </div>
              
              {isTemplate && (
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    defaultValue={frequency} 
                    onValueChange={(value) => setFrequency(value as ChecklistFrequency)}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One Time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="pt-2">
                <Button type="button" onClick={() => setActiveTab('items')}>
                  Continue to Items
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="items" className="space-y-4 py-4">
            <div className="space-y-6">
              {sections.map((section, index) => (
                <div key={section.id} className="space-y-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Input
                        value={section.title}
                        onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                        placeholder="Section Title"
                        className="font-medium"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveSection(section.id)}
                      disabled={sections.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove Section</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-2 pl-2">
                    {section.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="flex-none">
                          <Move className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={item.text}
                            onChange={(e) => handleUpdateItemText(section.id, item.id, e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`photo-${item.id}`}
                              checked={item.requiredPhoto}
                              onCheckedChange={() => handleToggleRequirePhoto(section.id, item.id)}
                            />
                            <Label htmlFor={`photo-${item.id}`} className="text-xs">Photo</Label>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveItem(section.id, item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove Item</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center"
                      onClick={() => handleAddItem(section.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleAddSection}
              >
                <Plus className="h-4 w-4 mr-2" /> Add New Section
              </Button>
              
              <div className="pt-2 flex justify-between">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setActiveTab('info')}
                >
                  Back to Info
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setActiveTab('options')}
                >
                  Continue to Options
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="options" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Branch Selection</Label>
                <p className="text-sm text-muted-foreground">
                  Add branches where this checklist can be used
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {branches.map(branch => (
                    <div
                      key={branch}
                      className="flex items-center bg-green-100 text-green-700 py-1 px-2 rounded-md text-sm font-medium border border-green-300"
                    >
                      <span>{branch}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 ml-1"
                        onClick={() => handleRemoveBranch(branch)}
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 flex-wrap w-full">
                  {allBranches.length > 0 && (
                    <div className="w-44">
                      <Select
                        value={selectedBranchDropdown}
                        onValueChange={handleAddBranchFromDropdown}
                      >
                        <SelectTrigger className="w-full" aria-label="Select existing branch">
                          <SelectValue placeholder="Select existing..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allBranches.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <span className="hidden sm:inline-block w-2" />
                  <Input
                    placeholder="Add new branch"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleAddBranch}
                    disabled={!newBranch.trim()}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
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
