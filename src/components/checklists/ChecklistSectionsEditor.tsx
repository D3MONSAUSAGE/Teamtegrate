
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Move } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { ChecklistSection, ChecklistItemStatus } from '@/types/checklist';

interface ChecklistSectionsEditorProps {
  sections: ChecklistSection[];
  onAddSection: () => void;
  onRemoveSection: (sectionId: string) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onAddItem: (sectionId: string) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onUpdateItemText: (sectionId: string, itemId: string, text: string) => void;
  onToggleRequirePhoto: (sectionId: string, itemId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const ChecklistSectionsEditor: React.FC<ChecklistSectionsEditorProps> = ({
  sections,
  onAddSection,
  onRemoveSection,
  onUpdateSectionTitle,
  onAddItem,
  onRemoveItem,
  onUpdateItemText,
  onToggleRequirePhoto,
  onBack,
  onContinue,
}) => (
  <div className="space-y-6">
    {sections.map((section, index) => (
      <div key={section.id} className="space-y-3 p-3 border rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Input
              value={section.title}
              onChange={e => onUpdateSectionTitle(section.id, e.target.value)}
              placeholder="Section Title"
              className="font-medium"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveSection(section.id)}
            disabled={sections.length === 1}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove Section</span>
          </Button>
        </div>
        <div className="space-y-2 pl-2">
          {section.items.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex-none">
                <Move className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <Input
                  value={item.text}
                  onChange={e => onUpdateItemText(section.id, item.id, e.target.value)}
                  placeholder="Item description"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`photo-${item.id}`}
                    checked={item.requiredPhoto}
                    onCheckedChange={() => onToggleRequirePhoto(section.id, item.id)}
                  />
                  <Label htmlFor={`photo-${item.id}`} className="text-xs">Photo</Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(section.id, item.id)}
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
            onClick={() => onAddItem(section.id)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
      </div>
    ))}

    <Button
      variant="outline"
      className="w-full"
      onClick={onAddSection}
    >
      <Plus className="h-4 w-4 mr-2" /> Add New Section
    </Button>

    <div className="pt-2 flex justify-between">
      <Button variant="outline" type="button" onClick={onBack}>
        Back to Info
      </Button>
      <Button type="button" onClick={onContinue}>
        Continue to Options
      </Button>
    </div>
  </div>
);

export default ChecklistSectionsEditor;
