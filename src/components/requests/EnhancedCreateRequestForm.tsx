import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  AlertCircle, 
  FileText, 
  CheckCircle,
  ArrowLeft,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { RequestTemplateMarketplace } from './RequestTemplateMarketplace';
import { RequestTemplate } from '@/hooks/requests/useRequestTemplates';
import { RequestType, FormField } from '@/types/requests';

interface EnhancedCreateRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EnhancedCreateRequestForm: React.FC<EnhancedCreateRequestFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [step, setStep] = useState<'template' | 'form'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<RequestTemplate | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | null>(null);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open && user?.organizationId) {
      fetchRequestTypes();
    }
  }, [open, user?.organizationId]);

  const fetchRequestTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('request_types')
        .select('*')
        .eq('organization_id', user?.organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRequestTypes((data || []) as unknown as RequestType[]);
    } catch (error) {
      console.error('Error fetching request types:', error);
      toast.error('Failed to load request types');
    }
  };

  const handleTemplateSelect = (template: RequestTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.name);
    setDescription(template.description || '');
    setPriority(template.template_data.default_priority || 'medium');
    
    // Initialize form data with template defaults
    const initialFormData: Record<string, any> = {};
    template.template_data.form_schema?.forEach((field: FormField) => {
      if (field.type === 'checkbox') {
        initialFormData[field.field] = false;
      } else if (field.type === 'number') {
        initialFormData[field.field] = field.min || 0;
      } else {
        initialFormData[field.field] = '';
      }
    });
    setFormData(initialFormData);
    
    setStep('form');
  };

  const handleRequestTypeSelect = (requestTypeId: string) => {
    const requestType = requestTypes.find(rt => rt.id === requestTypeId);
    if (requestType) {
      setSelectedRequestType(requestType);
      setTitle('');
      setDescription('');
      setPriority('medium');
      
      // Initialize form data
      const initialFormData: Record<string, any> = {};
      requestType.form_schema?.forEach((field: FormField) => {
        if (field.type === 'checkbox') {
          initialFormData[field.field] = false;
        } else if (field.type === 'number') {
          initialFormData[field.field] = field.min || 0;
        } else {
          initialFormData[field.field] = '';
        }
      });
      setFormData(initialFormData);
      
      setStep('form');
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderFormField = (field: FormField) => {
    const value = formData[field.field] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.field, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.field, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        );
      
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.field, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.field, parseFloat(e.target.value) || 0)}
            min={field.min}
            max={field.max}
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.field, e.target.value)}
            required={field.required}
          />
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.field}
              checked={value}
              onChange={(e) => handleFieldChange(field.field, e.target.checked)}
            />
            <Label htmlFor={field.field}>{field.label}</Label>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!user?.organizationId) {
      toast.error('No organization found');
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    const requestTypeId = selectedTemplate 
      ? null // We'll need to create a request type from template or use existing one
      : selectedRequestType?.id;

    if (!requestTypeId && !selectedTemplate) {
      toast.error('Please select a request type or template');
      return;
    }

    // Validate required fields
    const schema = selectedTemplate?.template_data.form_schema || selectedRequestType?.form_schema || [];
    const missingRequired = schema.filter(field => 
      field.required && !formData[field.field]
    );

    if (missingRequired.length > 0) {
      toast.error(`Please fill in required fields: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        organization_id: user.organizationId,
        requested_by: user.id,
        title,
        description,
        priority,
        status: 'draft',
        form_data: formData,
        template_used_id: selectedTemplate?.id || null,
        request_type_id: requestTypeId,
      };

      const { data, error } = await supabase
        .from('requests')
        .insert(requestData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Request created successfully');
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('template');
    setSelectedTemplate(null);
    setSelectedRequestType(null);
    setFormData({});
    setTitle('');
    setDescription('');
    setPriority('medium');
    setLoading(false);
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep('template');
    setSelectedTemplate(null);
    setSelectedRequestType(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === 'form' && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle>
              {step === 'template' ? 'Create New Request' : 'Request Details'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 'template' && (
          <div className="space-y-6">
            <RequestTemplateMarketplace
              onSelectTemplate={handleTemplateSelect}
              onCreateNew={() => {}} // We'll handle this differently
            />
            
            <div>
              <Separator className="my-4" />
              <h3 className="font-medium mb-3">Or choose from your organization's request types:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requestTypes.map(requestType => (
                  <Card 
                    key={requestType.id} 
                    className="p-3 hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => handleRequestTypeSelect(requestType.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{requestType.name}</h4>
                        <p className="text-xs text-muted-foreground">{requestType.description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Select
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-6">
            {/* Request source indicator */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              {selectedTemplate ? (
                <>
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm">Using template: <strong>{selectedTemplate.name}</strong></span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm">Using request type: <strong>{selectedRequestType?.name}</strong></span>
                </>
              )}
            </div>

            {/* Basic information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a clear, descriptive title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional context or details"
                rows={3}
              />
            </div>

            {/* Dynamic form fields */}
            {(selectedTemplate?.template_data.form_schema || selectedRequestType?.form_schema)?.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedTemplate?.template_data.form_schema || selectedRequestType?.form_schema || []).map((field: FormField) => (
                    <div key={field.field} className="space-y-2">
                      <Label htmlFor={field.field}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderFormField(field)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Request'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};