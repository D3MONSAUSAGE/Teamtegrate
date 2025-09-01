import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ExternalLink, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ExternalTrainingFlow from './ExternalTrainingFlow';

interface ComplianceTemplate {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  external_base_url: string;
  url_parameters: any;
  language_options: string[];
  role_classifications: string[];
  completion_method: string;
  is_required: boolean;
  is_active: boolean;
}

const ComplianceTrainingTemplateManager: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ComplianceTemplate | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jurisdiction: '',
    external_base_url: '',
    url_parameters: '{}',
    language_options: ['English'],
    role_classifications: ['Employee', 'Supervisor'],
    completion_method: 'external_certificate',
    is_required: true,
    is_active: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_training_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load compliance training templates');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      jurisdiction: '',
      external_base_url: '',
      url_parameters: '{}',
      language_options: ['English'],
      role_classifications: ['Employee', 'Supervisor'],
      completion_method: 'external_certificate',
      is_required: true,
      is_active: true
    });
    setEditingTemplate(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (template: ComplianceTemplate) => {
    setFormData({
      title: template.title,
      description: template.description || '',
      jurisdiction: template.jurisdiction,
      external_base_url: template.external_base_url,
      url_parameters: JSON.stringify(template.url_parameters, null, 2),
      language_options: template.language_options,
      role_classifications: template.role_classifications,
      completion_method: template.completion_method,
      is_required: template.is_required,
      is_active: template.is_active
    });
    setEditingTemplate(template);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let urlParameters;
      try {
        urlParameters = JSON.parse(formData.url_parameters);
      } catch {
        throw new Error('Invalid JSON in URL parameters');
      }

      const templateData = {
        title: formData.title,
        description: formData.description,
        jurisdiction: formData.jurisdiction,
        external_base_url: formData.external_base_url,
        url_parameters: urlParameters,
        language_options: formData.language_options,
        role_classifications: formData.role_classifications,
        completion_method: formData.completion_method,
        is_required: formData.is_required,
        is_active: formData.is_active,
        organization_id: user.organizationId
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('compliance_training_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        const { error } = await supabase
          .from('compliance_training_templates')
          .insert([templateData]);

        if (error) throw error;
        toast.success('Template created successfully');
      }

      setShowDialog(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: ComplianceTemplate) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('compliance_training_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const addLanguageOption = () => {
    const newLanguage = prompt('Enter language name:');
    if (newLanguage && !formData.language_options.includes(newLanguage)) {
      setFormData(prev => ({
        ...prev,
        language_options: [...prev.language_options, newLanguage]
      }));
    }
  };

  const removeLanguageOption = (language: string) => {
    if (formData.language_options.length > 1) {
      setFormData(prev => ({
        ...prev,
        language_options: prev.language_options.filter(l => l !== language)
      }));
    }
  };

  const addRoleClassification = () => {
    const newRole = prompt('Enter role classification:');
    if (newRole && !formData.role_classifications.includes(newRole)) {
      setFormData(prev => ({
        ...prev,
        role_classifications: [...prev.role_classifications, newRole]
      }));
    }
  };

  const removeRoleClassification = (role: string) => {
    if (formData.role_classifications.length > 1) {
      setFormData(prev => ({
        ...prev,
        role_classifications: prev.role_classifications.filter(r => r !== role)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Compliance Training Templates</h2>
          <p className="text-muted-foreground">
            Manage external compliance training templates for different jurisdictions
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.title}
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {template.is_required && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {template.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewTemplateId(template.id);
                      setShowPreview(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(template)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Jurisdiction:</span> {template.jurisdiction}
                </div>
                <div>
                  <span className="font-medium">Completion Method:</span> {template.completion_method}
                </div>
                <div>
                  <span className="font-medium">Languages:</span> {template.language_options.join(', ')}
                </div>
                <div>
                  <span className="font-medium">Role Classifications:</span> {template.role_classifications.join(', ')}
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium text-sm">Base URL:</span>
                <div className="text-sm text-muted-foreground break-all">
                  {template.external_base_url}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                No compliance training templates found. Create your first template to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              Configure external compliance training template settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., California Sexual Harassment Prevention Training"
                />
              </div>
              <div>
                <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                <Input
                  id="jurisdiction"
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                  placeholder="e.g., CA, NY, Federal"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the training requirements"
              />
            </div>

            <div>
              <Label htmlFor="external_base_url">External Base URL *</Label>
              <Input
                id="external_base_url"
                value={formData.external_base_url}
                onChange={(e) => setFormData(prev => ({ ...prev, external_base_url: e.target.value }))}
                placeholder="https://example.com/training/{role}/{language}/story.html"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {'{role}'} and {'{language}'} as placeholders for dynamic URL generation
              </p>
            </div>

            <div>
              <Label htmlFor="url_parameters">URL Parameters (JSON)</Label>
              <Textarea
                id="url_parameters"
                value={formData.url_parameters}
                onChange={(e) => setFormData(prev => ({ ...prev, url_parameters: e.target.value }))}
                placeholder='{"role_mapping": {"Employee": "NonSupervisory", "Supervisor": "Supervisory"}}'
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                JSON configuration for URL parameter mapping
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Language Options</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.language_options.map((language) => (
                    <Badge key={language} variant="secondary">
                      {language}
                      <button
                        onClick={() => removeLanguageOption(language)}
                        className="ml-2 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addLanguageOption}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Language
                </Button>
              </div>

              <div>
                <Label>Role Classifications</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.role_classifications.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                      <button
                        onClick={() => removeRoleClassification(role)}
                        className="ml-2 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addRoleClassification}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Role
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="completion_method">Completion Method</Label>
                <Select
                  value={formData.completion_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, completion_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external_certificate">External Certificate</SelectItem>
                    <SelectItem value="external_verification">External Verification</SelectItem>
                    <SelectItem value="self_attestation">Self Attestation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
                />
                <Label htmlFor="is_required">Required Training</Label>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="is_active">Active Template</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !formData.title || !formData.jurisdiction || !formData.external_base_url}>
              {loading ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Training Preview</DialogTitle>
            <DialogDescription>
              Preview how this training will appear to employees
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplateId && (
            <ExternalTrainingFlow
              templateId={previewTemplateId}
              onClose={() => setShowPreview(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplianceTrainingTemplateManager;