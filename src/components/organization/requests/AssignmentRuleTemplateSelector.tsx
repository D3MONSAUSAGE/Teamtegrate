import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useJobRoleAssignment } from '@/hooks/requests/useJobRoleAssignment';
import { FileText, Zap, CheckCircle } from 'lucide-react';

interface AssignmentRuleTemplateSelectorProps {
  onTemplateApply: (template: any) => void;
  requestCategory?: string;
}

const AssignmentRuleTemplateSelector: React.FC<AssignmentRuleTemplateSelectorProps> = ({
  onTemplateApply,
  requestCategory
}) => {
  const { templates } = useJobRoleAssignment();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const categoryTemplates = templates.filter(t => 
    !requestCategory || t.category === requestCategory || t.category === 'general'
  );

  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleApply = () => {
    if (selectedTemplate) {
      onTemplateApply(selectedTemplate.rule_config);
      setPreviewOpen(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'it': return 'bg-blue-100 text-blue-800';
      case 'hr': return 'bg-green-100 text-green-800';
      case 'finance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (categoryTemplates.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Quick Setup Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use pre-configured templates to quickly set up assignment rules.
            </p>
            <div className="grid gap-2">
              {categoryTemplates.map(template => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                      {template.is_global && (
                        <Badge variant="outline" className="text-xs">
                          Global
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(template)}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onTemplateApply(template.rule_config)}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description || 'No description available'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Configuration Preview</h4>
                <div className="space-y-2 text-sm">
                  {selectedTemplate.rule_config.assignment_strategy && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Strategy: {selectedTemplate.rule_config.assignment_strategy}</span>
                    </div>
                  )}
                  {selectedTemplate.rule_config.workload_balancing && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Workload balancing enabled</span>
                    </div>
                  )}
                  {selectedTemplate.rule_config.expertise_required && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Requires expertise: {selectedTemplate.rule_config.expertise_required.join(', ')}</span>
                    </div>
                  )}
                  {selectedTemplate.rule_config.escalation_rules && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Auto-escalation after {selectedTemplate.rule_config.escalation_rules.timeout_hours}h</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApply}>
                  <Zap className="h-3 w-3 mr-1" />
                  Apply Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssignmentRuleTemplateSelector;