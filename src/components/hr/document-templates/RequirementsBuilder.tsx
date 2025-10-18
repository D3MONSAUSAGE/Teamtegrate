import { useState } from 'react';
import { Plus, GripVertical, Edit, Trash2, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTemplateRequirements } from '@/hooks/document-templates';
import { AddRequirementDialog } from './AddRequirementDialog';
import { EditRequirementDialog } from './EditRequirementDialog';
import type { TemplateDocumentRequirement } from '@/types/document-templates';

interface RequirementsBuilderProps {
  templateId: string;
}

export const RequirementsBuilder = ({ templateId }: RequirementsBuilderProps) => {
  const { requirements, isLoading, deleteRequirement } = useTemplateRequirements(templateId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<TemplateDocumentRequirement | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete requirement "${name}"?`)) {
      deleteRequirement.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading requirements...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Document Requirements</h3>
          <p className="text-sm text-muted-foreground">
            Define which documents are needed for this template
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {requirements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileCheck className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              No documents added yet. Click "Add Document" to get started.
            </p>
            <Button onClick={() => setAddDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {requirements.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{req.document_name}</h4>
                        <p className="text-sm text-muted-foreground">{req.document_type}</p>
                        {req.instructions && (
                          <p className="text-sm mt-1 text-muted-foreground">{req.instructions}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRequirement(req)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(req.id, req.document_name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {req.is_required && <Badge variant="default">Required</Badge>}
                      {req.requires_expiry && (
                        <Badge variant="secondary">
                          Expires in {req.default_validity_days} days
                        </Badge>
                      )}
                      <Badge variant="outline">
                        Max {req.max_file_size_mb}MB
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddRequirementDialog
        templateId={templateId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
      {editingRequirement && (
        <EditRequirementDialog
          requirement={editingRequirement}
          open={!!editingRequirement}
          onOpenChange={(open) => !open && setEditingRequirement(null)}
        />
      )}
    </div>
  );
};
