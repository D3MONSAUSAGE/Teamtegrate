import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  AlertCircle
} from 'lucide-react';
import { useDocumentRequirements } from '@/hooks/onboarding/useOnboardingDocuments';
import { DocumentType, CreateDocumentRequirementRequest } from '@/types/onboarding-documents';

export function DocumentRequirementsManager() {
  const { requirements, isLoading, createRequirement, isCreating } = useDocumentRequirements();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateDocumentRequirementRequest>({
    name: '',
    description: '',
    document_type: 'custom',
    is_required: true,
    due_days_after_start: 3,
    instructions: '',
    allowed_file_types: ['pdf', 'doc', 'docx'],
    max_file_size_mb: 10,
    requires_approval: true,
    approver_roles: ['manager', 'admin', 'superadmin'],
  });

  const documentTypeLabels = {
    i9: 'I-9 Form',
    w4: 'W-4 Tax Form',
    emergency_contact: 'Emergency Contact Information',
    direct_deposit: 'Direct Deposit Form',
    policy_acknowledgment: 'Policy Acknowledgment',
    custom: 'Custom Document',
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      document_type: 'custom',
      is_required: true,
      due_days_after_start: 3,
      instructions: '',
      allowed_file_types: ['pdf', 'doc', 'docx'],
      max_file_size_mb: 10,
      requires_approval: true,
      approver_roles: ['manager', 'admin', 'superadmin'],
    });
  };

  const handleCreateRequirement = async () => {
    try {
      await createRequirement.mutateAsync(formData);
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Requirements</h2>
          <p className="text-muted-foreground">
            Configure and manage document requirements for onboarding processes
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Requirement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Document Requirement</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Document Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., I-9 Employment Eligibility Verification"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document_type">Document Type</Label>
                  <Select 
                    value={formData.document_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value as DocumentType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this document is for..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions for Employee</Label>
                <Textarea
                  id="instructions"
                  placeholder="Detailed instructions on how to complete and submit this document..."
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_days">Due Days After Start</Label>
                  <Input
                    id="due_days"
                    type="number"
                    min="1"
                    value={formData.due_days_after_start}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      due_days_after_start: parseInt(e.target.value) || 3 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_file_size">Max File Size (MB)</Label>
                  <Input
                    id="max_file_size"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.max_file_size_mb}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      max_file_size_mb: parseInt(e.target.value) || 10 
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                  />
                  <Label htmlFor="is_required">Required Document</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_approval"
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_approval: checked }))}
                  />
                  <Label htmlFor="requires_approval">Requires Manager Approval</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allowed File Types</Label>
                <div className="flex flex-wrap gap-2">
                  {['pdf', 'doc', 'docx', 'jpg', 'png', 'txt'].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={type}
                        checked={formData.allowed_file_types?.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              allowed_file_types: [...(prev.allowed_file_types || []), type]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              allowed_file_types: prev.allowed_file_types?.filter(t => t !== type) || []
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={type} className="text-sm">{type.toUpperCase()}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequirement}
                disabled={isCreating || !formData.name}
              >
                {isCreating ? 'Creating...' : 'Create Requirement'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requirements List */}
      <div className="grid gap-4">
        {requirements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Document Requirements</h3>
              <p className="text-muted-foreground mb-4">
                Create your first document requirement to get started with structured onboarding.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Requirement
              </Button>
            </CardContent>
          </Card>
        ) : (
          requirements.map((requirement) => (
            <Card key={requirement.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {requirement.name}
                      {requirement.is_required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {documentTypeLabels[requirement.document_type]} • 
                      Due {requirement.due_days_after_start} days after start date
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {requirement.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {requirement.description}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Max File Size:</span>
                    <div className="font-medium">{requirement.max_file_size_mb} MB</div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Allowed Types:</span>
                    <div className="font-medium">
                      {requirement.allowed_file_types.join(', ').toUpperCase()}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Approval:</span>
                    <div className="font-medium">
                      {requirement.requires_approval ? 'Required' : 'Not Required'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="font-medium">
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </div>

                {requirement.instructions && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Employee Instructions:
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {requirement.instructions}
                    </div>
                  </div>
                )}

                {requirement.requires_approval && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium mb-1 text-blue-800 flex items-center gap-1">
                      <Settings className="w-4 h-4" />
                      Approvers:
                    </div>
                    <div className="text-sm text-blue-700">
                      {requirement.approver_roles.map(role => 
                        role.charAt(0).toUpperCase() + role.slice(1)
                      ).join(', ')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}